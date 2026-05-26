"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

type Winner = { theme_ar: string; theme_en: string | null } | null;

export function WinningTheme() {
  const { locale, tr } = useLocale();
  const [winner, setWinner] = useState<Winner>(null);

  useEffect(() => {
    fetch("/api/themes")
      .then((r) => r.json())
      .then((d) => {
        if (d.announced && d.winner && (d.winner.theme_ar || d.winner.theme_en)) {
          setWinner(d.winner);
        }
      });
  }, []);

  if (!winner) return null;
  const text = locale === "ar" ? winner.theme_ar : winner.theme_en || winner.theme_ar;
  const sub = locale === "ar" ? winner.theme_en : winner.theme_ar;

  return (
    <div className="card-glow p-8 text-center mb-8">
      <div className="text-xs uppercase tracking-widest text-[color:var(--color-muted)] mb-2">
        {tr("theme_winner")}
      </div>
      <div className="text-3xl md:text-5xl font-black text-glow">{text}</div>
      {sub && <div className="text-[color:var(--color-muted)] mt-2">{sub}</div>}
    </div>
  );
}
