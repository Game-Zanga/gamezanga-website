"use client";

import { useLocale } from "@/components/LocaleProvider";

export function Steps() {
  const { tr } = useLocale();
  const steps = [
    { n: "1", title: tr("step1_title"), body: tr("step1_body") },
    { n: "2", title: tr("step2_title"), body: tr("step2_body") },
    { n: "3", title: tr("step3_title"), body: tr("step3_body") },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">{tr("steps_heading")}</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {steps.map((s) => (
          <div key={s.n} className="card-glow p-6">
            <div
              className="w-10 h-10 rounded-lg grid place-items-center font-black text-white mb-4"
              style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))" }}
            >
              {s.n}
            </div>
            <div className="text-xl font-bold mb-2">{s.title}</div>
            <p className="text-[color:var(--color-muted)] leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
