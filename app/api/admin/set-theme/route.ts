import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase-server";
import { JAM_CONFIG } from "@/lib/jam-config";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isAdminAuthorized())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ message: "Invalid origin" }, { status: 403 });
  let body: { theme_ar?: string; theme_en?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const theme_ar = (body.theme_ar ?? "").trim();
  const theme_en = (body.theme_en ?? "").trim();
  if (!theme_ar) return NextResponse.json({ message: "theme_ar required" }, { status: 400 });

  const svc = getServiceClient();
  const { error } = await svc
    .from("jam_phases")
    .upsert(
      {
        edition: JAM_CONFIG.edition,
        current_phase: "announced",
        winning_theme_ar: theme_ar,
        winning_theme_en: theme_en || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "edition" }
    );
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
