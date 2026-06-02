import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight endpoint the admin page hits on mount to determine if the
// HTTP-only session cookie is valid — needed because JS can't read the cookie.
export async function GET() {
  const ok = await isAdminAuthorized();
  if (!ok) return NextResponse.json({ authorized: false }, { status: 401 });
  return NextResponse.json({ authorized: true });
}
