import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { isRegistrationOpen } from "@/lib/phase-utils";
import { validateRegister } from "@/lib/validation";
import { JAM_CONFIG } from "@/lib/jam-config";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import RegistrationConfirmation from "@/emails/RegistrationConfirmation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isRegistrationOpen()) {
    return NextResponse.json({ code: "err_registration_closed" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ code: "err_invalid_json" }, { status: 400 });
  }

  const { data, errors } = validateRegister(body);
  if (!data) return NextResponse.json({ errors }, { status: 400 });

  const supabase = getServiceClient();

  const { data: existing } = await supabase
    .from("participants")
    .select("id")
    .eq("email", data.email)
    .eq("edition", JAM_CONFIG.edition)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { errors: [{ field: "email", code: "err_email_already_registered" }] },
      { status: 409 }
    );
  }

  const { data: inserted, error } = await supabase
    .from("participants")
    .insert({
      full_name: data.full_name,
      email: data.email,
      mobile: data.mobile ?? null,
      gender: data.gender ?? null,
      age_group: data.age_group,
      country: data.country,
      country_other: data.country_other ?? null,
      skills: data.skills,
      skills_other: data.skills_other ?? null,
      participated_before: data.participated_before,
      edition: JAM_CONFIG.edition,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("register insert failed", error);
    return NextResponse.json({ code: "err_save_failed" }, { status: 500 });
  }

  // Pre-create the Supabase auth user (already email-confirmed) so that subsequent
  // sign-in attempts via /suggest or /vote send the "Magic Link" email template
  // instead of the generic "Confirm Signup" template — and so that participants
  // who haven't registered can't request a sign-in link at all.
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

  return NextResponse.json({ success: true, id: inserted.id });
}
