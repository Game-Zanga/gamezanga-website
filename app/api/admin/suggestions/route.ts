import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase-server";
import { JAM_CONFIG } from "@/lib/jam-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const svc = getServiceClient();
  const { data, error } = await svc
    .from("theme_suggestions")
    .select("id, theme_ar, theme_en, approved, created_at")
    .eq("edition", JAM_CONFIG.edition)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ suggestions: data ?? [] });
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  let body: { id?: string; approved?: boolean | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

  const svc = getServiceClient();
  const { error } = await svc
    .from("theme_suggestions")
    .update({ approved: body.approved ?? null })
    .eq("id", body.id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
