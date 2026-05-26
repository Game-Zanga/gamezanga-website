"use client";

import { useLocale } from "@/components/LocaleProvider";

export function JudgingCriteria() {
  const { tr } = useLocale();
  const items = [
    { title: tr("jc_theme"), body: tr("jc_theme_body") },
    { title: tr("jc_fun"), body: tr("jc_fun_body") },
    { title: tr("jc_creativity"), body: tr("jc_creativity_body") },
    { title: tr("jc_visuals"), body: tr("jc_visuals_body") },
    { title: tr("jc_audio"), body: tr("jc_audio_body") },
  ];
  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">{tr("judging_heading")}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {items.map((it, i) => (
          <div key={i} className="card-glow p-5">
            <div className="font-bold mb-1">{it.title}</div>
            <p className="text-sm text-[color:var(--color-muted)]">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
