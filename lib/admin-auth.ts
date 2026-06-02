// Admin authentication — HTTP-only signed cookie.
//
// Flow:
//   1. Admin POSTs ADMIN_SECRET to /api/admin/login
//   2. Server compares (constant-time), then sets an HMAC-signed cookie
//      "gz_admin" with HttpOnly + SameSite=Strict + Secure (prod) flags.
//   3. Subsequent admin requests carry the cookie automatically; this module
//      verifies the HMAC + expiry on every check.
//
// The cookie value is the JWT-ish blob `<payloadB64>.<hmacHex>`. JavaScript
// can't read it (HttpOnly), so an XSS bug elsewhere on the site can't
// exfiltrate the admin secret like sessionStorage allowed before.

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "gz_admin";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 8; // 8 hours

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("hex");
}

export function createAdminToken(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET not set");
  const payload = JSON.stringify({ exp: Date.now() + ADMIN_SESSION_SECONDS * 1000, v: 1 });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

function verifyAdminToken(token: string): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const payloadB64 = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);
  const expectedSig = sign(payloadB64, secret);
  if (providedSig.length !== expectedSig.length) return false;
  try {
    const a = Buffer.from(providedSig, "hex");
    const b = Buffer.from(expectedSig, "hex");
    if (a.length !== b.length) return false;
    if (!timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * True if the request carries a valid admin session.
 */
export async function isAdminAuthorized(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

/**
 * Direct password comparison — used only by /api/admin/login. Constant-time.
 */
export function comparePassword(provided: string): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false;
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}
