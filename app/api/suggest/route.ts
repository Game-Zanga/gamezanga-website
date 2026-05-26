import { NextResponse } from "next/server";
import { getServerClient, getServiceClient } from "@/lib/supabase-server";
import { isSuggestionOpen } from "@/lib/phase-utils";
import { JAM_CONFIG } from "@/lib/jam-config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSuggestionOpen()) {
    return NextResponse.json({ code: "err_suggestions_closed" }, { status: 403 });
  }

  const auth = await getServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ code: "err_signin_required" }, { status: 401 });
  }

  let body: { theme_ar?: string; theme_en?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ code: "err_invalid_json" }, { status: 400 });
  }

  const theme_ar = (body.theme_ar ?? "").trim();
  const theme_en = body.theme_en ? String(body.theme_en).trim() : null;
  if (!theme_ar || theme_ar.length < 2 || theme_ar.length > 120) {
    return NextResponse.json({ code: "err_theme_length" }, { status: 400 });
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

  const { count } = await svc
    .from("theme_suggestions")
    .select("id", { count: "exact", head: true })
    .eq("participant_id", participant.id)
    .eq("edition", JAM_CONFIG.edition);

  if ((count ?? 0) >= JAM_CONFIG.max_suggestions_per_user) {
    return NextResponse.json({ code: "err_suggestion_limit" }, { status: 409 });
  }

  const { error } = await svc.from("theme_suggestions").insert({
    participant_id: participant.id,
    theme_ar,
    theme_en,
    edition: JAM_CONFIG.edition,
  });

  if (error) {
    console.error("suggest insert failed", error);
    return NextResponse.json({ code: "err_save_suggestion_failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
