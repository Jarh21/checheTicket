import { and, eq, gt } from "drizzle-orm";
import { db, sessionsTable } from "@workspace/db";
import {
  createSessionToken,
  hashSessionToken,
} from "./security";

export type SessionKind = "admin" | "license";

export async function createSession(
  kind: SessionKind,
  accountId: string | null,
): Promise<string> {
  const token = createSessionToken();
  const expiresAt = new Date(
    Date.now() + (kind === "admin" ? 12 : 30) * 24 * 60 * 60 * 1000,
  );

  await db.insert(sessionsTable).values({
    tokenHash: hashSessionToken(token),
    kind,
    accountId,
    expiresAt,
  });

  return token;
}

export async function findSession(
  token: string,
  kind: SessionKind,
): Promise<{ accountId: string | null; sessionId: string } | null> {
  const [session] = await db
    .select({
      id: sessionsTable.id,
      accountId: sessionsTable.accountId,
    })
    .from(sessionsTable)
    .where(
      and(
        eq(sessionsTable.tokenHash, hashSessionToken(token)),
        eq(sessionsTable.kind, kind),
        gt(sessionsTable.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return session ? { accountId: session.accountId, sessionId: session.id } : null;
}

export async function revokeSession(token: string): Promise<void> {
  await db
    .delete(sessionsTable)
    .where(eq(sessionsTable.tokenHash, hashSessionToken(token)));
}