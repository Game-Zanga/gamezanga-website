import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  comparePassword,
  createAdminToken,
} from "@/lib/admin-auth";
import { isSameOrigin } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ message: "Invalid origin" }, { status: 403 });
  }

  // Brute-force protection. ADMIN_SECRET is 64 hex chars (256 bits) so
  // online guessing is already infeasible — this is belt-and-braces.
  const rl = await checkRateLimit(req, { bucket: "admin-login", limit: 5, windowSeconds: 300 });
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many attempts" },
      { status: 429, headers: rl.retryAfter ? { "Retry-After": String(rl.retryAfter) } : {} }
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const provided = (body.password ?? "").trim();
  if (!comparePassword(provided)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const token = createAdminToken();
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });

  return NextResponse.json({ success: true });
}
