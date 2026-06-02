import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase-server";
import { JAM_CONFIG } from "@/lib/jam-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only view of live voting results. Mirrors the SQL in CLAUDE.md but
// served via an authenticated endpoint so the admin panel can poll it without
// leaving the page.
export async function GET() {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const svc = getServiceClient();

  const { data: themes, error } = await svc
    .from("theme_suggestions")
    .select("id, theme_ar, theme_en, approved")
    .eq("edition", JAM_CONFIG.edition)
    .eq("approved", true);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const { data: votes, error: vErr } = await svc
    .from("votes")
    .select("theme_id, value")
    .eq("edition", JAM_CONFIG.edition);
  if (vErr) return NextResponse.json({ message: vErr.message }, { status: 500 });

  type Row = {
    id: string;
    theme_ar: string;
    theme_en: string | null;
    score: number;
    yes: number;
    neutral: number;
    no: number;
    voters: number;
  };
  const map: Record<string, Row> = {};
  for (const t of themes ?? []) {
    map[t.id as string] = {
      id: t.id as string,
      theme_ar: t.theme_ar as string,
      theme_en: (t.theme_en as string | null) ?? null,
      score: 0,
      yes: 0,
      neutral: 0,
      no: 0,
      voters: 0,
    };
  }
  for (const v of votes ?? []) {
    const row = map[v.theme_id as string];
    if (!row) continue;
    const val = v.value as number;
    row.score += val;
    row.voters += 1;
    if (val > 0) row.yes += 1;
    else if (val < 0) row.no += 1;
    else row.neutral += 1;
  }

  // Distinct voter count = distinct participants who cast any rating this edition.
  const { data: voterRows } = await svc
    .from("votes")
    .select("participant_id")
    .eq("edition", JAM_CONFIG.edition);
  const distinctVoters = new Set((voterRows ?? []).map((r) => r.participant_id as string)).size;

  const results = Object.values(map).sort((a, b) => b.score - a.score);
  return NextResponse.json({
    results,
    distinct_voters: distinctVoters,
    total_themes: results.length,
  });
}
