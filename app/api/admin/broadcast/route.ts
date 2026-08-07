import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase-server";
import { JAM_CONFIG } from "@/lib/jam-config";
import { EMAIL_FROM, getResend } from "@/lib/resend";
import { isSameOrigin } from "@/lib/csrf";
import { dbErrorResponse } from "@/lib/api-errors";
import BroadcastGeneral from "@/emails/BroadcastGeneral";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isAdminAuthorized())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ message: "Invalid origin" }, { status: 403 });

  let body: {
    subject?: string;
    body_ar?: string;
    body_en?: string;
    editions?: string[] | "all";
    skip?: number;
    limit?: number;
  };
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
    // ORDER BY is required, not cosmetic: without it Postgres gives no stable
    // row order across the paginated .range() calls, so both this pagination and
    // the `skip` resume offset below could silently skip or duplicate people.
    let query = svc
      .from("participants")
      .select("email")
      .order("created_at", { ascending: true })
      .order("email", { ascending: true })
      .range(from, from + PAGE - 1);
    if (Array.isArray(target) && target.length > 0) {
      // overlaps = at least one element of `editions` is in the target list (`&&` in PG).
      query = query.overlaps("editions", target);
    }
    const { data, error } = await query;
    if (error) return dbErrorResponse("admin/broadcast", error);
    if (!data || data.length === 0) break;
    allRows.push(...(data as { email: string }[]));
    if (data.length < PAGE) break;
  }

  const allEmails = allRows.map((r) => r.email).filter(Boolean);

  // `skip` lets a broadcast be resumed across days when the Resend plan's daily
  // quota can't cover the whole list in one go (the response reports where it
  // stopped). `limit` caps a single run below the remaining quota.
  const skip = Math.max(0, Number(body.skip ?? 0) || 0);
  const limit = Math.max(1, Number(body.limit ?? allEmails.length) || allEmails.length);
  const emails = allEmails.slice(skip, skip + limit);

  const resend = getResend();
  let sent = 0;
  let failed = 0;
  let stoppedAt: number | null = null;
  let stopReason = "";

  // Resend's API allows ~2 requests/second and every plan has a daily quota.
  //
  // This used to be a per-recipient loop with no delay, which fired the whole
  // list as fast as the API answered (~200 req/s on 2026-08-07) — it tripped the
  // rate limit, burned the daily quota for the entire account (killing Supabase's
  // magic-link sign-in emails too, since they relay through the same Resend
  // account), and reported everything as "sent" because resend.emails.send()
  // RESOLVES with { error } instead of throwing. Both of those are fixed here:
  // batch endpoint (100 recipients per request), paced, with the error inspected.
  const BATCH_SIZE = 100;
  const GAP_MS = 600; // under the 2 req/s limit
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Render the template once rather than per recipient — every recipient gets
  // identical content, only `to` differs.
  const { render } = await import("@react-email/render");
  const html = await render(BroadcastGeneral({ bodyAr: body_ar, bodyEn: body_en }));

  let rateLimitRetries = 0;
  const MAX_RATE_LIMIT_RETRIES = 5;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);

    const { data, error } = await resend.batch.send(
      chunk.map((to) => ({ from: EMAIL_FROM, to, subject, html })),
      // One malformed legacy address must not reject the other 99.
      { batchValidation: "permissive" }
    );

    if (error) {
      const name = (error as { name?: string }).name ?? "";
      failed += chunk.length;
      console.error("broadcast batch failed", name, error.message);

      // Quota exhaustion is terminal for today — stop instead of hammering the
      // API with every remaining recipient and reporting a fictional success.
      if (name === "daily_quota_exceeded" || name === "monthly_quota_exceeded") {
        stoppedAt = skip + i;
        stopReason = error.message;
        break;
      }
      if (name === "rate_limit_exceeded" && rateLimitRetries < MAX_RATE_LIMIT_RETRIES) {
        rateLimitRetries++;
        await sleep(GAP_MS * 4 * rateLimitRetries);
        i -= BATCH_SIZE; // `continue` still runs i += BATCH_SIZE, so this retries the chunk
        failed -= chunk.length;
        continue;
      }
      continue;
    }

    rateLimitRetries = 0;
    sent += (data as { data?: unknown[] } | null)?.data?.length ?? chunk.length;
    await sleep(GAP_MS);
  }

  return NextResponse.json({
    success: stoppedAt === null,
    sent,
    failed,
    total: emails.length,
    audience_total: allEmails.length,
    skip,
    // When a run stops early, this is the `skip` value to resume from tomorrow.
    resume_from: stoppedAt,
    message: stopReason || undefined,
  });
}
