"use client";

import { useLocale } from "@/components/LocaleProvider";

// Partner & media-partner logos. Hosted locally under /public/images/partners/.
// Order matches the existing site layout (left-to-right, top-to-bottom).
const PARTNERS: { src: string; alt: string; href?: string }[] = [
  { src: "/images/partners/saudi-game-news.png",         alt: "Saudi Game News",               href: "https://links.saudigamenews.com/" },
  { src: "/images/partners/unreal-amman.png",            alt: "Unreal Engine Amman",           href: "https://communities.unrealengine.com/amman/" },
  { src: "/images/partners/gaming-lab.png",              alt: "Gaming Lab — Maysalward",       href: "https://gaminglab.maysalward.com/" },
  { src: "/images/partners/jam3et-games.png",            alt: "جمعة الألعاب / Jam3et Games",    href: "https://www.instagram.com/jam3et_games/" },
  { src: "/images/partners/6wrni.png",                   alt: "6wrni",                         href: "https://twitter.com/6wrni" },
  { src: "/images/partners/moroccan-game-devs.png",      alt: "Moroccan Game Developers",      href: "https://www.facebook.com/MoroccanGameDevelopers/" },
  { src: "/images/partners/sudanese-game-collective.png", alt: "Sudanese Game Collective",     href: "https://twitter.com/SudaneseGameCol" },
  { src: "/images/partners/egyptian-game-devs.png",      alt: "Egyptian Game Developers",      href: "https://egdevsa.com/" },
  { src: "/images/partners/gdf-egypt.png",               alt: "Game Developers Forum — Egypt", href: "https://gdfegypt.org/" },
  { src: "/images/partners/gamedevs-mena.png",           alt: "Game Devs MENA",                href: "https://twitter.com/GameDevsMENA" },
  { src: "/images/partners/leb-game-dev.png",            alt: "Lebanese Game Developers",      href: "https://twitter.com/LebGameDev" },
  { src: "/images/partners/game-dev-qatar.png",          alt: "Game Dev Qatar",                href: "https://twitter.com/GameDevQatar" },
];

const MEDIA_PARTNERS: { src: string; alt: string; href?: string }[] = [
  { src: "/images/partners/true-gaming.png",      alt: "True Gaming",                   href: "https://www.true-gaming.net/" },
  { src: "/images/partners/saudi-gamer.png",      alt: "Saudi Gamer",                   href: "https://www.saudigamer.com/" },
  { src: "/images/partners/arab-game-awards.png", alt: "Arab Game Awards",              href: "https://arabgameawards.com/" },
  { src: "/images/partners/digitale-anime.png",   alt: "ديجيتال انيم / Digitale Anime",  href: "https://ar.digitaleanime.dz/" },
];

export function Partners() {
  const { tr } = useLocale();
  return (
    <section className="max-w-4xl mx-auto px-4 py-16">
      <PartnerRow heading={tr("partners_heading")} items={PARTNERS} placeholder={tr("partners_placeholder")} />
      <div className="h-12" />
      <PartnerRow
        heading={tr("media_partners_heading")}
        items={MEDIA_PARTNERS}
        placeholder={tr("partners_placeholder")}
        compact
      />
    </section>
  );
}

function PartnerRow({
  heading,
  items,
  placeholder,
  compact = false,
}: {
  heading: string;
  items: { src: string; alt: string; href?: string }[];
  placeholder: string;
  compact?: boolean;
}) {
  // 12 partners → 6 columns × 2 rows on desktop (each tile ≈ 100–110px)
  // 4 media partners → centered, 4 across on desktop (also small squares)
  const gridClass = compact
    ? "grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-md mx-auto"
    : "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3";

  return (
    <div>
      <h3 className="text-2xl font-bold text-center mb-6">{heading}</h3>
      {items.length === 0 ? (
        <div className="text-center text-[color:var(--color-muted)]">{placeholder}</div>
      ) : (
        <div className={gridClass}>
          {items.map((p, i) => {
            const tile = (
              <div className="aspect-square rounded-lg bg-white/95 p-2.5 grid place-items-center hover:bg-white hover:-translate-y-0.5 transition-all shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt={p.alt}
                  loading="lazy"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            );
            return p.href ? (
              <a
                key={i}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                aria-label={p.alt}
                title={p.alt}
              >
                {tile}
              </a>
            ) : (
              <div key={i} title={p.alt}>
                {tile}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
