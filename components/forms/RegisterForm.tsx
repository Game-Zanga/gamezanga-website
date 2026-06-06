"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { COUNTRIES, trCode } from "@/lib/i18n";
import { Turnstile } from "@/components/forms/Turnstile";

type State = "idle" | "submitting" | "success" | "error";

const TURNSTILE_ENABLED = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function RegisterForm() {
  const { locale, tr } = useLocale();
  const [state, setState] = useState<State>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string>("");
  // Cloudflare Turnstile CAPTCHA token. Empty until the widget completes its
  // background challenge. `widgetKey` bumps to remount the widget for a fresh
  // token after a failed submission (tokens are single-use).
  const [turnstileToken, setTurnstileToken] = useState("");
  const [widgetKey, setWidgetKey] = useState(0);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    mobile: "",
    gender: "" as "" | "male" | "female",
    age_group: "" as "" | "under_18" | "18_22" | "23_29" | "30_39" | "over_40",
    country: "",
    country_other: "",
    skills: [] as string[],
    skills_other: "",
    participated_before: "" as "" | "yes" | "no",
  });

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleSkill(s: string) {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(s) ? f.skills.filter((x) => x !== s) : [...f.skills, s],
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setErrors({});
    setErrorMsg("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          participated_before: form.participated_before === "yes",
          turnstile_token: turnstileToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        // Token was consumed by the verify call (single-use). Force the widget
        // to re-render so the user gets a fresh token without manual interaction.
        setTurnstileToken("");
        setWidgetKey((k) => k + 1);
        if (Array.isArray(data?.errors)) {
          const e: Record<string, string> = {};
          for (const err of data.errors) e[err.field] = trCode(err.code, locale);
          setErrors(e);
          // Field errors are already shown inline — don't double up with a banner.
          return;
        }
        setErrorMsg(trCode(data?.code, locale));
        return;
      }
      setState("success");
    } catch {
      setState("error");
      setTurnstileToken("");
      setWidgetKey((k) => k + 1);
      setErrorMsg(trCode("err_network", locale));
    }
  }

  if (state === "success") {
    return (
      <div className="card-glow p-8 text-center">
        <div className="text-2xl font-bold mb-2">{tr("register_success")}</div>
        <div className="text-[color:var(--color-muted)]">{tr("field_email_hint")}</div>
      </div>
    );
  }

  const skills: { v: "programming" | "art" | "design" | "audio" | "other"; label: string }[] = [
    { v: "programming", label: tr("skill_programming") },
    { v: "art", label: tr("skill_art") },
    { v: "design", label: tr("skill_design") },
    { v: "audio", label: tr("skill_audio") },
    { v: "other", label: tr("skill_other") },
  ];

  const ages: { v: "under_18" | "18_22" | "23_29" | "30_39" | "over_40"; label: string }[] = [
    { v: "under_18", label: tr("age_under_18") },
    { v: "18_22", label: tr("age_18_22") },
    { v: "23_29", label: tr("age_23_29") },
    { v: "30_39", label: tr("age_30_39") },
    { v: "over_40", label: tr("age_over_40") },
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field label={`${tr("field_full_name")} *`} hint={tr("field_full_name_hint")} error={errors.full_name}>
        <input
          required
          className="input"
          value={form.full_name}
          onChange={(e) => update("full_name", e.target.value)}
        />
      </Field>

      <Field label={`${tr("field_email")} *`} hint={tr("field_email_hint")} error={errors.email}>
        <input
          required
          type="email"
          className="input"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </Field>

      <Field label={tr("field_mobile")} hint={tr("optional")} error={errors.mobile}>
        <input
          type="tel"
          className="input"
          value={form.mobile}
          onChange={(e) => update("mobile", e.target.value)}
        />
      </Field>

      <Field label={tr("field_gender")} hint={tr("optional")} error={errors.gender}>
        <div className="flex gap-3">
          {(["male", "female"] as const).map((g) => (
            <label key={g} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                checked={form.gender === g}
                onChange={() => update("gender", g)}
              />
              <span>{g === "male" ? tr("gender_male") : tr("gender_female")}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field label={`${tr("field_age")} *`} error={errors.age_group}>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ages.map((a) => (
            <label
              key={a.v}
              className={`px-3 py-2 rounded-md border text-center cursor-pointer text-sm transition ${
                form.age_group === a.v
                  ? "bg-[color:var(--color-accent)]/15 border-[color:var(--color-accent)]"
                  : "border-[color:var(--color-border)] hover:bg-[color:var(--color-surface)]"
              }`}
            >
              <input
                type="radio"
                name="age_group"
                className="sr-only"
                checked={form.age_group === a.v}
                onChange={() => update("age_group", a.v)}
              />
              {a.label}
            </label>
          ))}
        </div>
      </Field>

      <Field label={`${tr("field_country")} *`} error={errors.country}>
        <select
          required
          className="select"
          value={form.country}
          onChange={(e) => update("country", e.target.value)}
        >
          <option value="">--</option>
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>
              {locale === "ar" ? c.ar : c.en}
            </option>
          ))}
        </select>
        {form.country === "Other" && (
          <input
            className="input mt-2"
            placeholder={tr("field_country_other")}
            value={form.country_other}
            onChange={(e) => update("country_other", e.target.value)}
          />
        )}
        {errors.country_other && <div className="error mt-1">{errors.country_other}</div>}
      </Field>

      <Field label={`${tr("field_skills")} *`} error={errors.skills}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {skills.map((s) => {
            const active = form.skills.includes(s.v);
            return (
              <label
                key={s.v}
                className={`px-3 py-2 rounded-md border cursor-pointer text-sm transition ${
                  active
                    ? "bg-[color:var(--color-accent)]/15 border-[color:var(--color-accent)]"
                    : "border-[color:var(--color-border)] hover:bg-[color:var(--color-surface)]"
                }`}
              >
                <input type="checkbox" className="sr-only" checked={active} onChange={() => toggleSkill(s.v)} />
                {s.label}
              </label>
            );
          })}
        </div>
        {form.skills.includes("other") && (
          <input
            className="input mt-2"
            placeholder={tr("field_skills_other")}
            value={form.skills_other}
            onChange={(e) => update("skills_other", e.target.value)}
          />
        )}
        {errors.skills_other && <div className="error mt-1">{errors.skills_other}</div>}
      </Field>

      <Field label={`${tr("field_participated_before")} *`} error={errors.participated_before}>
        <div className="flex gap-3">
          {(["yes", "no"] as const).map((v) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="participated_before"
                checked={form.participated_before === v}
                onChange={() => update("participated_before", v)}
              />
              <span>{v === "yes" ? tr("yes") : tr("no")}</span>
            </label>
          ))}
        </div>
      </Field>

      {/* Cloudflare Turnstile invisible-ish CAPTCHA. Renders nothing if env not set (local dev). */}
      <Turnstile
        key={widgetKey}
        onToken={setTurnstileToken}
        onError={() => setErrorMsg(trCode("err_captcha_failed", locale))}
        theme="dark"
      />

      {errorMsg && <div className="error">{errorMsg}</div>}

      <button
        type="submit"
        disabled={state === "submitting" || (TURNSTILE_ENABLED && !turnstileToken)}
        className="btn btn-primary w-full md:w-auto"
      >
        {state === "submitting" ? tr("submitting") : tr("submit")}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && !error && <div className="hint">{hint}</div>}
      {error && <div className="error mt-1">{error}</div>}
    </div>
  );
}
