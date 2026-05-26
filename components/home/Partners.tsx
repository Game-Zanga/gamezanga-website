"use client";

import { useLocale } from "@/components/LocaleProvider";

// Drop logos into /public/images/partners/ and list them here.
// Empty list → renders the placeholder.
const PARTNERS: { src: string; alt: string; href?: string }[] = [];
const MEDIA_PARTNERS: { src: string; alt: string; href?: string }[] = [];

export function Partners() {
  const { tr } = useLocale();
  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <PartnerRow heading={tr("partners_heading")} items={PARTNERS} placeholder={tr("partners_placeholder")} />
      <div className="h-12" />
      <PartnerRow heading={tr("media_partners_heading")} items={MEDIA_PARTNERS} placeholder={tr("partners_placeholder")} />
    </section>
  );
}

function PartnerRow({
  heading,
  items,
  placeholder,
}: {
  heading: string;
  items: { src: string; alt: string; href?: string }[];
  placeholder: string;
}) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-center mb-6">{heading}</h3>
      {items.length === 0 ? (
        <div className="text-center text-[color:var(--color-muted)]">{placeholder}</div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-6">
          {items.map((p, i) => {
            const img = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.src}
                alt={p.alt}
                className="h-12 md:h-16 grayscale opacity-80 hover:opacity-100 hover:grayscale-0 transition"
              />
            );
            return p.href ? (
              <a key={i} href={p.href} target="_blank" rel="noreferrer">
                {img}
              </a>
            ) : (
              <div key={i}>{img}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
