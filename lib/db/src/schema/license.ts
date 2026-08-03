import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

const id = (name: string) =>
  text(name)
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const accountsTable = pgTable(
  "license_accounts",
  {
    id: id("id"),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    company: text("company"),
    phone: text("phone"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("license_accounts_email_idx").on(table.email)],
);

export const licensesTable = pgTable(
  "licenses",
  {
    id: id("id"),
    accountId: text("account_id")
      .notNull()
      .references(() => accountsTable.id, { onDelete: "cascade" })
      .unique(),
    status: text("status").notNull().default("active"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    maxDevices: integer("max_devices").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("licenses_status_idx").on(table.status),
    index("licenses_expires_at_idx").on(table.expiresAt),
  ],
);

export const devicesTable = pgTable(
  "license_devices",
  {
    id: id("id"),
    licenseId: text("license_id")
      .notNull()
      .references(() => licensesTable.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    deviceName: text("device_name").notNull().default("Dispositivo"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revoked: boolean("revoked").notNull().default(false),
  },
  (table) => [
    unique("license_devices_license_device_unique").on(
      table.licenseId,
      table.deviceId,
    ),
    index("license_devices_license_idx").on(table.licenseId),
  ],
);

export const sessionsTable = pgTable(
  "license_sessions",
  {
    id: id("id"),
    tokenHash: text("token_hash").notNull().unique(),
    kind: text("kind").notNull(),
    accountId: text("account_id").references(() => accountsTable.id, {
      onDelete: "cascade",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("license_sessions_token_hash_idx").on(table.tokenHash),
    index("license_sessions_account_idx").on(table.accountId),
  ],
);

export const adminUsersTable = pgTable("license_admin_users", {
  id: id("id"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const deviceAuthEventsTable = pgTable(
  "license_device_auth_events",
  {
    id: id("id"),
    licenseId: text("license_id").references(() => licensesTable.id, {
      onDelete: "cascade",
    }),
    deviceRecordId: text("device_record_id").references(() => devicesTable.id, {
      onDelete: "set null",
    }),
    email: text("email").notNull(),
    deviceId: text("device_id").notNull(),
    deviceName: text("device_name"),
    outcome: text("outcome").notNull(),
    reason: text("reason").notNull(),
    httpStatus: integer("http_status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("license_device_auth_events_created_idx").on(table.createdAt),
    index("license_device_auth_events_license_idx").on(table.licenseId),
    index("license_device_auth_events_device_idx").on(table.deviceId),
  ],
);

export const insertAccountSchema = createInsertSchema(accountsTable);
export const insertLicenseSchema = createInsertSchema(licensesTable);
export const insertDeviceSchema = createInsertSchema(devicesTable);
export const insertSessionSchema = createInsertSchema(sessionsTable);
export const insertAdminUserSchema = createInsertSchema(adminUsersTable);
export const insertDeviceAuthEventSchema = createInsertSchema(deviceAuthEventsTable);

export type Account = typeof accountsTable.$inferSelect;
export type License = typeof licensesTable.$inferSelect;
export type Device = typeof devicesTable.$inferSelect;
export type Session = typeof sessionsTable.$inferSelect;
export type AdminUser = typeof adminUsersTable.$inferSelect;
export type DeviceAuthEvent = typeof deviceAuthEventsTable.$inferSelect;