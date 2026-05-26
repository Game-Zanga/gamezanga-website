// Constant-time check of the X-Admin-Secret header against ADMIN_SECRET.

import { timingSafeEqual } from "node:crypto";

export function isAdminAuthorized(req: Request): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false;
  const provided = req.headers.get("x-admin-secret") ?? "";
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}
