import { NextResponse } from "next/server";
import { getServerClient, getServiceClient } from "@/lib/supabase-server";
import { isVotingOpen } from "@/lib/phase-utils";
import { JAM_CONFIG } from "@/lib/jam-config";

export const runtime = "nodejs";

// POST: upsert a rating of -1 | 0 | 1 for a given theme. Replaces any existing rating.
export async function POST(req: Request) {
  if (!isVotingOpen()) {
    return NextResponse.json({ code: "err_voting_closed" }, { status: 403 });
  }

  const auth = await getServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ code: "err_signin_required" }, { status: 401 });
  }

  let body: { theme_id?: string; value?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ code: "err_invalid_json" }, { status: 400 });
  }

  const theme_id = String(body.theme_id ?? "");
  if (!theme_id) return NextResponse.json({ code: "err_missing_theme" }, { status: 400 });

  const value = body.value;
  if (value !== -1 && value !== 0 && value !== 1) {
    return NextResponse.json({ code: "err_invalid_vote_value" }, { status: 400 });
  }

  const svc = getServiceClient();

  const { data: participant } = await svc
    .from("participants")
    .select("id")
    .eq("email", user.email.toLowerCase())
    .eq("edition", JAM_CONFIG.edition)
    .maybeSingle();

  if (!participant) {
    return NextResponse.json({ code: "err_must_be_registered" }, { status: 403 });
  }

  // Verify the theme is approved + same edition (prevents clients from voting on rejected/foreign themes).
  const { data: theme } = await svc
    .from("theme_suggestions")
    .select("id, edition, approved")
    .eq("id", theme_id)
    .maybeSingle();
  if (!theme || theme.approved !== true || theme.edition !== JAM_CONFIG.edition) {
    return NextResponse.json({ code: "err_invalid_theme" }, { status: 400 });
  }

  // Upsert by (participant_id, theme_id, edition).
  const { error } = await svc
    .from("votes")
    .upsert(
      {
        participant_id: participant.id,
        theme_id,
        value,
        edition: JAM_CONFIG.edition,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "participant_id,theme_id,edition" }
    );

  if (error) {
    console.error("vote upsert failed", error);
    return NextResponse.json({ code: "err_save_vote_failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// GET: returns the current user's ratings for all themes in this edition: { votes: { theme_id: -1|0|1 } }.
export async function GET() {
  const auth = await getServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user?.email) return NextResponse.json({ votes: {} });

  const svc = getServiceClient();
  const { data: participant } = await svc
    .from("participants")
    .select("id")
    .eq("email", user.email.toLowerCase())
    .eq("edition", JAM_CONFIG.edition)
    .maybeSingle();
  if (!participant) return NextResponse.json({ votes: {} });

  const { data: rows } = await svc
    .from("votes")
    .select("theme_id, value")
    .eq("participant_id", participant.id)
    .eq("edition", JAM_CONFIG.edition);

  const votes: Record<string, number> = {};
  for (const r of rows ?? []) votes[r.theme_id as string] = r.value as number;

  return NextResponse.json({ votes });
}
