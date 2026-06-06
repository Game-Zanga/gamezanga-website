import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { isRegistrationOpen } from "@/lib/phase-utils";
import { validateRegister } from "@/lib/validation";
import { JAM_CONFIG } from "@/lib/jam-config";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import { isSameOrigin } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import RegistrationConfirmation from "@/emails/RegistrationConfirmation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // EMERGENCY MAINTENANCE — flip MAINTENANCE_MODE=true in Vercel env to instantly
  // block all registration attempts (e.g. during a spam attack). Returns 503
  // before any DB or auth work so it costs essentially nothing per request.
  // To re-enable: delete the env var (or set to anything other than "true") and redeploy.
  if (process.env.MAINTENANCE_MODE === "true") {
    return NextResponse.json({ code: "err_maintenance" }, { status: 503 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ code: "err_bad_origin" }, { status: 403 });
  }
  // Rate limit by IP: 10 attempts per 10 minutes. Tightens on mass-spam bots
  // without inconveniencing real participants (most register once).
  const rl = await checkRateLimit(req, { bucket: "register", limit: 10, windowSeconds: 600 });
  if (!rl.ok) {
    return NextResponse.json(
      { code: "err_rate_limited" },
      { status: 429, headers: rl.retryAfter ? { "Retry-After": String(rl.retryAfter) } : {} }
    );
  }
  if (!isRegistrationOpen()) {
    return NextResponse.json({ code: "err_registration_closed" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ code: "err_invalid_json" }, { status: 400 });
  }

  // Verify Cloudflare Turnstile token BEFORE any DB work. Bots without a valid
  // browser-side challenge response will get rejected here. Verification is
  // skipped if TURNSTILE_SECRET_KEY isn't set (dev convenience).
  const turnstileToken = typeof (body as { turnstile_token?: unknown })?.turnstile_token === "string"
    ? (body as { turnstile_token: string }).turnstile_token
    : "";
  const turnstileResult = await verifyTurnstile(turnstileToken, req);
  if (!turnstileResult.ok) {
    console.warn("Turnstile verify failed:", turnstileResult.reason);
    return NextResponse.json({ code: "err_captcha_failed" }, { status: 403 });
  }

  const { data, errors } = validateRegister(body);
  if (!data) return NextResponse.json({ errors }, { status: 400 });

  const supabase = getServiceClient();

  // One row per email globally. Look up by email and decide insert vs. update.
  const { data: existing } = await supabase
    .from("participants")
    .select("id, editions")
    .eq("email", data.email)
    .maybeSingle();

  const profileFields = {
    full_name: data.full_name,
    mobile: data.mobile ?? null,
    gender: data.gender ?? null,
    age_group: data.age_group,
    country: data.country,
    country_other: data.country_other ?? null,
    skills: data.skills,
    skills_other: data.skills_other ?? null,
    participated_before: data.participated_before,
  };

  let participantId: string;

  const currentTag = String(JAM_CONFIG.edition);

  if (existing) {
    const editions = (existing.editions as string[]) ?? [];
    if (editions.includes(currentTag)) {
      // Already registered for THIS edition — reject duplicates.
      return NextResponse.json(
        { errors: [{ field: "email", code: "err_email_already_registered" }] },
        { status: 409 }
      );
    }

    // Returning participant: append current edition ONLY.
    //
    // SECURITY: we deliberately do NOT update profile fields here. Anyone who
    // knows a participant's email (e.g. from a leaked legacy CSV) could
    // otherwise hijack their identity by submitting the form with the victim's
    // email + bogus data, overwriting name/mobile/country/skills.
    //
    // If a returning participant needs to update their info, they should email
    // the organizer — or we can add an authenticated profile-edit flow later.
    const nextEditions = [...editions, currentTag];
    const { error: updateErr } = await supabase
      .from("participants")
      .update({ editions: nextEditions })
      .eq("id", existing.id);

    if (updateErr) {
      console.error("register update failed", updateErr);
      return NextResponse.json({ code: "err_save_failed" }, { status: 500 });
    }
    participantId = existing.id as string;
  } else {
    // First-time registration.
    const { data: inserted, error: insertErr } = await supabase
      .from("participants")
      .insert({
        ...profileFields,
        email: data.email,
        editions: [currentTag],
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      console.error("register insert failed", insertErr);
      return NextResponse.json({ code: "err_save_failed" }, { status: 500 });
    }
    participantId = inserted.id;
  }

  // Pre-create the Supabase auth user (already email-confirmed) so that subsequent
  // sign-in attempts via /suggest or /vote send the "Magic Link" email template
  // instead of the generic "Confirm Signup" template — and so that participants
  // who haven't registered can't request a sign-in link at all.
  //
  // Returning participants will already have an auth user; we tolerate the
  // "already exists" error silently.
  try {
    const { error: authErr } = await supabase.auth.admin.createUser({
      email: data.email,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, edition: JAM_CONFIG.edition },
    });
    if (authErr && !/already been registered|already exists/i.test(authErr.message)) {
      console.error("auth.admin.createUser failed", authErr);
    }
  } catch (e) {
    console.error("auth.admin.createUser threw", e);
  }

  // Confirmation email — don't fail the request if email send fails.
  try {
    if (process.env.RESEND_API_KEY) {
      const resend = getResend();
      await resend.emails.send({
        from: EMAIL_FROM,
        to: data.email,
        subject: `${JAM_CONFIG.name_ar} ${JAM_CONFIG.edition} — تأكيد التسجيل / Registration Confirmed`,
        react: RegistrationConfirmation({ fullName: data.full_name }),
      });
    }
  } catch (e) {
    console.error("registration email failed", e);
  }

  return NextResponse.json({ success: true, id: participantId });
}
