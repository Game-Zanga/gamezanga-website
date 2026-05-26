"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { FAQ, SUBMISSION_RULES } from "@/lib/content";

export default function RulesPage() {
  const { locale, tr } = useLocale();
  const rules = SUBMISSION_RULES[locale];

  return (
    <section className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-10">{tr("rules_heading")}</h1>

      <div className="card-glow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">{tr("rules_submission_heading")}</h2>
        <ul className="list-disc ms-6 space-y-2 text-[color:var(--color-muted)]">
          {rules.map((r, i) => (
            <li key={i} className="leading-relaxed">{r}</li>
          ))}
        </ul>
      </div>

      <div className="card-glow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">{tr("judging_heading")}</h2>
        <ol className="list-decimal ms-6 space-y-2 text-[color:var(--color-muted)]">
          <li><strong className="text-[color:var(--color-fg)]">{tr("jc_theme")}</strong> — {tr("jc_theme_body")}</li>
          <li><strong className="text-[color:var(--color-fg)]">{tr("jc_fun")}</strong> — {tr("jc_fun_body")}</li>
          <li><strong className="text-[color:var(--color-fg)]">{tr("jc_creativity")}</strong> — {tr("jc_creativity_body")}</li>
          <li><strong className="text-[color:var(--color-fg)]">{tr("jc_visuals")}</strong> — {tr("jc_visuals_body")}</li>
          <li><strong className="text-[color:var(--color-fg)]">{tr("jc_audio")}</strong> — {tr("jc_audio_body")}</li>
        </ol>
      </div>

      <h2 className="text-2xl font-bold text-center mb-6">{tr("faq_heading")}</h2>
      <div className="space-y-3">
        {FAQ.map((item, i) => (
          <FaqItem
            key={i}
            q={locale === "ar" ? item.q_ar : item.q_en}
            a={locale === "ar" ? item.a_ar : item.a_en}
          />
        ))}
      </div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card-glow">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 p-4 text-start"
      >
        <span className="font-medium">{q}</span>
        <span className="text-[color:var(--color-muted)] text-xl leading-none select-none">
          {open ? "–" : "+"}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-[color:var(--color-muted)] leading-relaxed">{a}</div>
      )}
    </div>
  );
}
