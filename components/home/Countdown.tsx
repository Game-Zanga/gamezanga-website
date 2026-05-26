"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { JAM_CONFIG } from "@/lib/jam-config";
import { timeUntil } from "@/lib/phase-utils";

const padPair = (n: number) => n.toString().padStart(2, "0");

export function Countdown() {
  const { locale, tr } = useLocale();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    // SSR placeholder — keeps layout stable
    return <div className="h-32" aria-hidden />;
  }

  const t = timeUntil(JAM_CONFIG.jam_start, now);
  const labels = {
    days: locale === "ar" ? "يوم" : "Days",
    hours: locale === "ar" ? "ساعة" : "Hours",
    minutes: locale === "ar" ? "دقيقة" : "Minutes",
    seconds: locale === "ar" ? "ثانية" : "Seconds",
  };

  if (t.done) {
    return (
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-glow">
          {locale === "ar" ? "الزنقة قد بدأت!" : "The jam is live!"}
        </div>
      </div>
    );
  }

  const segments = [
    { v: t.days, l: labels.days },
    { v: t.hours, l: labels.hours },
    { v: t.minutes, l: labels.minutes },
    { v: t.seconds, l: labels.seconds },
  ];

  return (
    <div>
      <div className="text-center text-sm uppercase tracking-widest text-[color:var(--color-muted)] mb-3">
        {tr("countdown_to_jam")}
      </div>
      <div className="flex items-stretch justify-center gap-2 md:gap-4">
        {segments.map((s, i) => (
          <div
            key={i}
            className="card-glow px-3 md:px-5 py-3 md:py-4 min-w-[68px] md:min-w-[96px] text-center"
          >
            <div className="font-mono text-2xl md:text-4xl font-bold text-glow tabular-nums">
              {padPair(s.v)}
            </div>
            <div className="text-[10px] md:text-xs text-[color:var(--color-muted)] uppercase tracking-wider mt-1">
              {s.l}
            </div>
          </div>
        ))}
      </div>
      <div className="text-center text-xs text-[color:var(--color-muted)] mt-3">
        {tr("ksa_time")}
      </div>
    </div>
  );
}
