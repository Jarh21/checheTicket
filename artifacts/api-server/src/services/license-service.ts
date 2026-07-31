import { and, eq, inArray, sql } from "drizzle-orm";
import {
  adminUsersTable,
  accountsTable,
  db,
  devicesTable,
  licensesTable,
} from "@workspace/db";
import { AppError } from "../lib/errors";
import {
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from "../lib/security";

type LicenseRow = {
  id: string;
  accountId: string;
  email: string;
  name: string;
  company: string | null;
  phone: string | null;
  status: string;
  startsAt: Date;
  expiresAt: Date;
  maxDevices: number;
  createdAt: Date;
  updatedAt: Date;
  deviceCount: number;
};

function publicLicense(row: LicenseRow) {
  const status =
    row.expiresAt <= new Date() && row.status === "active"
      ? "expired"
      : row.status;
  return {
    id: row.id,
    accountId: row.accountId,
    email: row.email,
    name: row.name,
    ...(row.company ? { company: row.company } : {}),
    ...(row.phone ? { phone: row.phone } : {}),
    status,
    startsAt: row.startsAt,
    expiresAt: row.expiresAt,
    maxDevices: row.maxDevices,
    deviceCount: row.deviceCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getDeviceCounts(licenseIds: string[]): Promise<Map<string, number>> {
  if (licenseIds.length === 0) return new Map();
  const rows = await db
    .select({
      licenseId: devicesTable.licenseId,
      count: sql<number>`count(*)::int`,
    })
    .from(devicesTable)
    .where(
      and(
        inArray(devicesTable.licenseId, licenseIds),
        eq(devicesTable.revoked, false),
      ),
    )
    .groupBy(devicesTable.licenseId);
  return new Map(rows.map((row) => [row.licenseId, row.count]));
}

async function selectLicenseRows(licenseId?: string): Promise<LicenseRow[]> {
  const licenses = await db
    .select({
      id: licensesTable.id,
      accountId: licensesTable.accountId,
      email: accountsTable.email,
      name: accountsTable.name,
      company: accountsTable.company,
      phone: accountsTable.phone,
      status: licensesTable.status,
      startsAt: licensesTable.startsAt,
      expiresAt: licensesTable.expiresAt,
      maxDevices: licensesTable.maxDevices,
      createdAt: licensesTable.createdAt,
      updatedAt: licensesTable.updatedAt,
    })
    .from(licensesTable)
    .innerJoin(accountsTable, eq(accountsTable.id, licensesTable.accountId))
    .where(licenseId ? eq(licensesTable.id, licenseId) : undefined)
    .orderBy(licensesTable.expiresAt);

  const counts = await getDeviceCounts(licenses.map((row) => row.id));
  return licenses.map((row) => ({
    ...row,
    deviceCount: counts.get(row.id) ?? 0,
  }));
}

export async function listPublicLicenses() {
  return (await selectLicenseRows()).map(publicLicense);
}

export async function getPublicLicense(licenseId: string) {
  const [row] = await selectLicenseRows(licenseId);
  if (!row) throw new AppError(404, "Licencia no encontrada");
  return publicLicense(row);
}

export async function createLicense(input: {
  email: string;
  password: string;
  name: string;
  company?: string;
  phone?: string;
  durationDays: number;
  maxDevices?: number;
}) {
  const email = normalizeEmail(input.email);
  const existing = await db
    .select({ id: accountsTable.id })
    .from(accountsTable)
    .where(eq(accountsTable.email, email))
    .limit(1);
  if (existing[0]) throw new AppError(409, "El correo ya está registrado");

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + input.durationDays * 24 * 60 * 60 * 1000,
  );
  const passwordHash = await hashPassword(input.password);
  const accountId = crypto.randomUUID();
  const licenseId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(accountsTable).values({
      id: accountId,
      email,
      passwordHash,
      name: input.name.trim(),
      company: input.company?.trim() || null,
      phone: input.phone?.trim() || null,
    });
    await tx.insert(licensesTable).values({
      id: licenseId,
      accountId,
      startsAt: now,
      expiresAt,
      maxDevices: input.maxDevices ?? 1,
    });
  });

  return getPublicLicense(licenseId);
}

export async function updateLicense(
  licenseId: string,
  input: {
    name?: string;
    company?: string;
    phone?: string;
    status?: "active" | "suspended";
    maxDevices?: number;
  },
) {
  const [license] = await db
    .select({ accountId: licensesTable.accountId })
    .from(licensesTable)
    .where(eq(licensesTable.id, licenseId))
    .limit(1);
  if (!license) throw new AppError(404, "Licencia no encontrada");

  await db.transaction(async (tx) => {
    const accountUpdates: Partial<typeof accountsTable.$inferInsert> = {};
    if (input.name !== undefined) accountUpdates.name = input.name.trim();
    if (input.company !== undefined)
      accountUpdates.company = input.company.trim() || null;
    if (input.phone !== undefined)
      accountUpdates.phone = input.phone.trim() || null;
    if (Object.keys(accountUpdates).length > 0) {
      await tx
        .update(accountsTable)
        .set(accountUpdates)
        .where(eq(accountsTable.id, license.accountId));
    }

    const licenseUpdates: Partial<typeof licensesTable.$inferInsert> = {};
    if (input.status !== undefined) licenseUpdates.status = input.status;
    if (input.maxDevices !== undefined)
      licenseUpdates.maxDevices = input.maxDevices;
    if (Object.keys(licenseUpdates).length > 0) {
      await tx
        .update(licensesTable)
        .set(licenseUpdates)
        .where(eq(licensesTable.id, licenseId));
    }
  });

  return getPublicLicense(licenseId);
}

export async function renewLicense(licenseId: string, durationDays: number) {
  const [license] = await db
    .select({
      expiresAt: licensesTable.expiresAt,
    })
    .from(licensesTable)
    .where(eq(licensesTable.id, licenseId))
    .limit(1);
  if (!license) throw new AppError(404, "Licencia no encontrada");

  const now = new Date();
  const base = license.expiresAt > now ? license.expiresAt : now;
  const expiresAt = new Date(
    base.getTime() + durationDays * 24 * 60 * 60 * 1000,
  );
  await db
    .update(licensesTable)
    .set({ expiresAt, status: "active" })
    .where(eq(licensesTable.id, licenseId));

  return getPublicLicense(licenseId);
}

export async function authenticateLicense(input: {
  email: string;
  password: string;
  deviceId: string;
  deviceName?: string;
}) {
  const email = normalizeEmail(input.email);
  const [row] = await db
    .select({
      account: accountsTable,
      license: licensesTable,
    })
    .from(accountsTable)
    .innerJoin(licensesTable, eq(licensesTable.accountId, accountsTable.id))
    .where(eq(accountsTable.email, email))
    .limit(1);
  if (!row || !(await verifyPassword(input.password, row.account.passwordHash))) {
    throw new AppError(401, "Correo o contraseña inválidos");
  }
  if (row.account.status !== "active") {
    throw new AppError(403, "La cuenta está suspendida");
  }
  if (row.license.status === "suspended") {
    throw new AppError(403, "La licencia está suspendida");
  }
  if (row.license.expiresAt <= new Date()) {
    if (row.license.status !== "expired") {
      await db
        .update(licensesTable)
        .set({ status: "expired" })
        .where(eq(licensesTable.id, row.license.id));
    }
    throw new AppError(401, "La licencia ha vencido");
  }

  const [existingDevice] = await db
    .select()
    .from(devicesTable)
    .where(
      and(
        eq(devicesTable.licenseId, row.license.id),
        eq(devicesTable.deviceId, input.deviceId),
      ),
    )
    .limit(1);
  if (existingDevice?.revoked) {
    throw new AppError(403, "Este dispositivo fue revocado");
  }
  if (!existingDevice) {
    const countRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(devicesTable)
      .where(
        and(
          eq(devicesTable.licenseId, row.license.id),
          eq(devicesTable.revoked, false),
        ),
      );
    if ((countRows[0]?.count ?? 0) >= row.license.maxDevices) {
      throw new AppError(403, "Se alcanzó el límite de dispositivos");
    }
    await db.insert(devicesTable).values({
      licenseId: row.license.id,
      deviceId: input.deviceId,
      deviceName: input.deviceName?.trim() || "Dispositivo",
    });
  } else {
    await db
      .update(devicesTable)
      .set({
        deviceName: input.deviceName?.trim() || existingDevice.deviceName,
        lastSeenAt: new Date(),
      })
      .where(eq(devicesTable.id, existingDevice.id));
  }

  const sessionLicense = await getPublicLicense(row.license.id);
  return {
    account: {
      id: row.account.id,
      email: row.account.email,
      name: row.account.name,
      ...(row.account.company ? { company: row.account.company } : {}),
      ...(row.account.phone ? { phone: row.account.phone } : {}),
      status: row.account.status,
    },
    license: sessionLicense,
    serverTime: new Date(),
  };
}

export async function getLicenseSession(accountId: string) {
  const [row] = await selectLicenseRows(
    (
      await db
        .select({ id: licensesTable.id })
        .from(licensesTable)
        .where(eq(licensesTable.accountId, accountId))
        .limit(1)
    )[0]?.id,
  );
  if (!row) throw new AppError(404, "Licencia no encontrada");
  if (row.expiresAt <= new Date() || row.status !== "active") {
    throw new AppError(401, "La licencia no está activa");
  }

  const [account] = await db
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.id, accountId))
    .limit(1);
  if (!account) throw new AppError(404, "Cuenta no encontrada");
  return {
    account: {
      id: account.id,
      email: account.email,
      name: account.name,
      ...(account.company ? { company: account.company } : {}),
      ...(account.phone ? { phone: account.phone } : {}),
      status: account.status,
    },
    license: publicLicense(row),
    serverTime: new Date(),
  };
}

export async function listDevices(licenseId: string) {
  await getPublicLicense(licenseId);
  return db
    .select({
      id: devicesTable.id,
      deviceId: devicesTable.deviceId,
      deviceName: devicesTable.deviceName,
      lastSeenAt: devicesTable.lastSeenAt,
      createdAt: devicesTable.createdAt,
      revoked: devicesTable.revoked,
    })
    .from(devicesTable)
    .where(eq(devicesTable.licenseId, licenseId))
    .orderBy(devicesTable.lastSeenAt);
}

export async function getDashboard() {
  const licenses = await listPublicLicenses();
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const devices = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(devicesTable)
    .where(eq(devicesTable.revoked, false));
  return {
    total: licenses.length,
    active: licenses.filter((license) => license.status === "active").length,
    expiringSoon: licenses.filter(
      (license) =>
        license.status === "active" &&
        license.expiresAt > now &&
        license.expiresAt <= soon,
    ).length,
    expired: licenses.filter(
      (license) =>
        license.status === "expired" || license.expiresAt <= now,
    ).length,
    suspended: licenses.filter((license) => license.status === "suspended")
      .length,
    devices: devices[0]?.count ?? 0,
  };
}

export async function authenticateAdmin(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);
  const [admin] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.email, email))
    .limit(1);
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    throw new AppError(401, "Correo o contraseña inválidos");
  }
  return { email: admin.email };
}

export async function ensureAdminUser() {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const configuredEmail = process.env.ADMIN_EMAIL?.trim();
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!isDevelopment && (!configuredEmail || !configuredPassword)) {
    throw new Error(
      "ADMIN_EMAIL y ADMIN_PASSWORD son obligatorios fuera de desarrollo",
    );
  }
  const password = configuredPassword ?? "admin12345";
  if (!isDevelopment && password.length < 12) {
    throw new Error("ADMIN_PASSWORD debe tener al menos 12 caracteres");
  }

  const email = normalizeEmail(configuredEmail ?? "admin@hotspot.local");
  const [existing] = await db
    .select({ id: adminUsersTable.id })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.email, email))
    .limit(1);
  if (!existing) {
    await db.insert(adminUsersTable).values({
      email,
      passwordHash: await hashPassword(password),
    });
  }
}