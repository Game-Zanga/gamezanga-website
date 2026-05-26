import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { JAM_CONFIG } from "@/lib/jam-config";
import { isThemeAnnounced } from "@/lib/phase-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const svc = getServiceClient();

  const { data: themes, error } = await svc
    .from("theme_suggestions")
    .select("id, theme_ar, theme_en")
    .eq("edition", JAM_CONFIG.edition)
    .eq("approved", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("themes fetch failed", error);
    return NextResponse.json({ code: "err_save_failed" }, { status: 500 });
  }

  // Score + per-bucket breakdown — DELIBERATELY hidden while voting is open,
  // so voters can't be biased by current standings. Only exposed after voting
  // closes or once the winning theme is announced.
  type Stats = { score: number; positive: number; neutral: number; negative: number; voters: number };
  const stats: Record<string, Stats> = {};
  const exposeScores = isThemeAnnounced();
  if (exposeScores) {
    const { data: votes } = await svc
      .from("votes")
      .select("theme_id, value")
      .eq("edition", JAM_CONFIG.edition);
    if (votes) {
      for (const v of votes) {
        const id = v.theme_id as string;
        const val = v.value as number;
        const s = (stats[id] ??= { score: 0, positive: 0, neutral: 0, negative: 0, voters: 0 });
        s.score += val;
        s.voters += 1;
        if (val > 0) s.positive += 1;
        else if (val < 0) s.negative += 1;
        else s.neutral += 1;
      }
    }
  }

  // Winner row
  const { data: phaseRow } = await svc
    .from("jam_phases")
    .select("winning_theme_ar, winning_theme_en")
    .eq("edition", JAM_CONFIG.edition)
    .maybeSingle();

  return NextResponse.json({
    themes: (themes ?? []).map((t) => {
      const s = stats[t.id as string] ?? { score: 0, positive: 0, neutral: 0, negative: 0, voters: 0 };
      return {
        id: t.id,
        theme_ar: t.theme_ar,
        theme_en: t.theme_en,
        score: s.score,
        positive: s.positive,
        neutral: s.neutral,
        negative: s.negative,
        voters: s.voters,
      };
    }),
    announced: isThemeAnnounced(),
    winner: isThemeAnnounced()
      ? {
          theme_ar: phaseRow?.winning_theme_ar || JAM_CONFIG.announced_theme_ar,
          theme_en: phaseRow?.winning_theme_en || JAM_CONFIG.announced_theme_en,
        }
      : null,
  });
}
