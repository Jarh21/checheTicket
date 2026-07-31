import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  encodedHash: string,
): Promise<boolean> {
  const [algorithm, salt, storedKey] = encodedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !storedKey) return false;

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(storedKey, "hex");
  return (
    expected.length === derivedKey.length &&
    timingSafeEqual(expected, derivedKey)
  );
}

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}