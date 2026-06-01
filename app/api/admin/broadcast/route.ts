import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase-server";
import { JAM_CONFIG } from "@/lib/jam-config";
import { EMAIL_FROM, getResend } from "@/lib/resend";
import BroadcastGeneral from "@/emails/BroadcastGeneral";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let body: { subject?: string; body_ar?: string; body_en?: string; editions?: string[] | "all" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const subject = (body.subject ?? "").trim();
  const body_ar = (body.body_ar ?? "").trim();
  const body_en = (body.body_en ?? "").trim();
  if (!subject || !body_ar) return NextResponse.json({ message: "subject + body_ar required" }, { status: 400 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ message: "RESEND_API_KEY not set" }, { status: 500 });

  // Targeting (tags are strings since participants.editions is TEXT[]):
  //   body.editions = "all"          → everyone ever registered (any edition)
  //   body.editions = ["13", "SE"]   → anyone whose editions array overlaps these
  //   body.editions = undefined      → defaults to current edition only
  const target: string[] | "all" = body.editions ?? [String(JAM_CONFIG.edition)];

  const svc = getServiceClient();
  // Paginate around Supabase's default 1000-row cap so broadcasts to the full
  // ~2k legacy list don't silently truncate.
  const PAGE = 1000;
  const allRows: { email: string }[] = [];
  for (let from = 0; ; from += PAGE) {
    let query = svc.from("participants").select("email").range(from, from + PAGE - 1);
    if (Array.isArray(target) && target.length > 0) {
      // overlaps = at least one element of `editions` is in the target list (`&&` in PG).
      query = query.overlaps("editions", target);
    }
    const { data, error } = await query;
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    allRows.push(...(data as { email: string }[]));
    if (data.length < PAGE) break;
  }

  const emails = allRows.map((r) => r.email).filter(Boolean);
  const resend = getResend();
  let sent = 0;
  let failed = 0;

  // Send sequentially with a small delay to stay friendly to Resend's rate limits.
  for (const to of emails) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject,
        react: BroadcastGeneral({ bodyAr: body_ar, bodyEn: body_en }),
      });
      sent++;
    } catch (e) {
      failed++;
      console.error("broadcast send failed", to, e);
    }
  }

  return NextResponse.json({ success: true, sent, failed, total: emails.length });
}
