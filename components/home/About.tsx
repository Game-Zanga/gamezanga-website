"use client";

import { useLocale } from "@/components/LocaleProvider";

export function AboutSection() {
  const { tr } = useLocale();
  return (
    <section className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-6">{tr("about_heading")}</h2>
      <p className="text-lg text-[color:var(--color-muted)] leading-loose">{tr("about_body")}</p>
    </section>
  );
}
