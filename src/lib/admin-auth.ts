import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "./cookies";

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "development") {
    return "dev-only-session-secret-min-16-chars";
  }
  throw new Error(
    "SESSION_SECRET must be set (min 16 chars) for admin authentication",
  );
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function verifyAdminCookie(value: string | undefined | null): boolean {
  if (!value) return false;
  const adminPass =
    process.env.ADMIN_PASSWORD ??
    (process.env.NODE_ENV === "development" ? "admin" : undefined);
  if (!adminPass) return false;
  const expected = sign(`admin:${adminPass}`);
  try {
    const a = Buffer.from(value, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function setAdminCookie(): Promise<void> {
  const adminPass =
    process.env.ADMIN_PASSWORD ??
    (process.env.NODE_ENV === "development" ? "admin" : undefined);
  if (!adminPass) {
    throw new Error("ADMIN_PASSWORD is not configured");
  }
  const token = sign(`admin:${adminPass}`);
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearAdminCookie(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}
