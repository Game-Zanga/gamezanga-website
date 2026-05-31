"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { JAM_CONFIG } from "@/lib/jam-config";

const linkClass =
  "text-[color:var(--color-accent)] underline underline-offset-2 hover:opacity-80 transition-opacity";

export function Steps() {
  const { tr, locale } = useLocale();

  const steps = [
    {
      n: "1",
      title: tr("step1_title"),
      body:
        locale === "ar" ? (
          <>
            املأ نموذج التسجيل{" "}
            <Link href="/register" className={linkClass}>
              هنا
            </Link>{" "}
            قبل بداية الزنقة.
          </>
        ) : (
          <>
            Fill out the registration form{" "}
            <Link href="/register" className={linkClass}>
              here
            </Link>{" "}
            before the jam starts.
          </>
        ),
    },
    {
      n: "2",
      title: tr("step2_title"),
      body:
        locale === "ar" ? (
          <>
            اقترح ثيمات{" "}
            <Link href="/suggest" className={linkClass}>
              هنا
            </Link>{" "}
            وصوّت{" "}
            <Link href="/vote" className={linkClass}>
              هنا
            </Link>{" "}
            على المواضيع المرشحه.
          </>
        ) : (
          <>
            Suggest themes{" "}
            <Link href="/suggest" className={linkClass}>
              here
            </Link>{" "}
            and vote{" "}
            <Link href="/vote" className={linkClass}>
              here
            </Link>{" "}
            on the nominated themes.
          </>
        ),
    },
    {
      n: "3",
      title: tr("step3_title"),
      body:
        locale === "ar" ? (
          <>
            سجل{" "}
            <a href={JAM_CONFIG.itchio_url} target="_blank" rel="noreferrer" className={linkClass}>
              هنا
            </a>{" "}
            في الموقع المضيف (itch.io) حتي ترفع لعبتك في صفحة الزنقة.
          </>
        ) : (
          <>
            Register{" "}
            <a href={JAM_CONFIG.itchio_url} target="_blank" rel="noreferrer" className={linkClass}>
              here
            </a>{" "}
            on the host site (itch.io) to upload your game to the jam page.
          </>
        ),
    },
    {
      n: "4",
      title: tr("step4_title"),
      body:
        locale === "ar" ? (
          <>
            انضم{" "}
            <a href={JAM_CONFIG.discord_url} target="_blank" rel="noreferrer" className={linkClass}>
              هنا
            </a>{" "}
            الى سيرفر زنقة الالعاب الرسمي على منصة الدسكورد للتواصل مع المزنوقيين.
          </>
        ) : (
          <>
            Join{" "}
            <a href={JAM_CONFIG.discord_url} target="_blank" rel="noreferrer" className={linkClass}>
              here
            </a>{" "}
            to the official Game Zanga Discord server to connect with fellow jammers.
          </>
        ),
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">{tr("steps_heading")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
