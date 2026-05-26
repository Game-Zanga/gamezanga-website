"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { getBrowserClient } from "@/lib/supabase-browser";
import { JAM_CONFIG } from "@/lib/jam-config";
import { trCode } from "@/lib/i18n";

type Mine = { id: string; theme_ar: string; theme_en: string | null };

export function SuggestForm({ email }: { email: string }) {
  const { tr, locale } = useLocale();
  const [mySuggestions, setMySuggestions] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);
  const [themeAr, setThemeAr] = useState("");
  const [themeEn, setThemeEn] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const remaining = Math.max(0, JAM_CONFIG.max_suggestions_per_user - mySuggestions.length);

  async function refresh() {
    const supabase = getBrowserClient();
    const { data: participant } = await supabase
      .from("participants")
      .select("id")
      .eq("email", email)
      .eq("edition", JAM_CONFIG.edition)
      .maybeSingle();

    if (!participant) {
      setMySuggestions([]);
      setLoading(false);
      return;
    }
    const { data: rows } = await supabase
      .from("theme_suggestions")
      .select("id, theme_ar, theme_en")
      .eq("participant_id", participant.id)
      .eq("edition", JAM_CONFIG.edition)
      .order("created_at", { ascending: false });
    setMySuggestions((rows ?? []) as Mine[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!themeAr.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme_ar: themeAr.trim(), theme_en: themeEn.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(trCode(data?.code, locale));
      } else {
        setSuccess(true);
        setThemeAr("");
        setThemeEn("");
        await refresh();
      }
    } catch {
      setError(trCode("err_network", locale));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-[color:var(--color-muted)]">…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="card-glow p-5">
        <div className="text-sm text-[color:var(--color-muted)] mb-1">
          {tr("suggest_remaining")}: <strong className="text-[color:var(--color-fg)]">{remaining}</strong> / {JAM_CONFIG.max_suggestions_per_user}
        </div>
        {mySuggestions.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {mySuggestions.map((s) => (
              <li key={s.id} className="text-[color:var(--color-muted)]">
                • {s.theme_ar}
                {s.theme_en ? ` — ${s.theme_en}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      {remaining > 0 ? (
        <form onSubmit={submit} className="card-glow p-6 space-y-4">
          <div>
            <label className="label">{tr("suggest_label_ar")} *</label>
            <input
              required
              className="input"
              value={themeAr}
              onChange={(e) => setThemeAr(e.target.value)}
              maxLength={120}
            />
          </div>
          <div>
            <label className="label">{tr("suggest_label_en")}</label>
            <input
              className="input"
              value={themeEn}
              onChange={(e) => setThemeEn(e.target.value)}
              maxLength={120}
              dir="ltr"
            />
          </div>
          {error && <div className="error">{error}</div>}
          {success && <div className="text-[color:var(--color-success)] text-sm">{tr("suggest_submitted")}</div>}
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? tr("submitting") : tr("submit")}
          </button>
        </form>
      ) : null}
    </div>
  );
}
