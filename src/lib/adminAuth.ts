import crypto from "crypto";
import { cookies } from "next/headers";
import { ADMIN_SESSION_MAX_AGE_SECONDS } from "@/lib/config";

export const ADMIN_COOKIE_NAME = "nimsa_admin_session";

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "insecure-dev-secret-change-me";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

/** issuedAt.signature — a lightweight, dependency-free signed session token. */
export function createSessionToken(): string {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${sign(issuedAt)}`;
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;

  const expected = sign(issuedAt);
  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;
  if (!crypto.timingSafeEqual(expectedBuf, receivedBuf)) return false;

  const age = Date.now() - Number(issuedAt);
  if (Number.isNaN(age) || age < 0 || age > ADMIN_SESSION_MAX_AGE_SECONDS * 1000) return false;

  return true;
}

/** Constant-time password comparison, tolerant of different-length inputs. */
export function isCorrectAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  const candidateHash = crypto.createHash("sha256").update(candidate).digest();
  const expectedHash = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(candidateHash, expectedHash);
}

/** Server-only helper: is the current request's cookie a valid admin session? */
export function isAdminAuthenticated(): boolean {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  return isValidSessionToken(token);
}
