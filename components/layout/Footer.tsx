"use client";

import { useLocale } from "@/components/LocaleProvider";
import { JAM_CONFIG } from "@/lib/jam-config";

export function Footer() {
  const { locale, tr } = useLocale();

  const socials = [
    { href: JAM_CONFIG.discord_url, label: "Discord", icon: DiscordIcon },
    { href: JAM_CONFIG.twitter_url, label: "Twitter", icon: TwitterIcon },
    { href: JAM_CONFIG.youtube_url, label: "YouTube", icon: YouTubeIcon },
    { href: JAM_CONFIG.instagram_url, label: "Instagram", icon: InstagramIcon },
    { href: JAM_CONFIG.facebook_url, label: "Facebook", icon: FacebookIcon },
    { href: JAM_CONFIG.linkedin_url, label: "LinkedIn", icon: LinkedInIcon },
  ];

  return (
    <footer className="border-t border-[color:var(--color-border)] bg-[color:var(--color-bg-2)] mt-24">
      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
        <div>
          <div className="text-lg font-bold">
            {locale === "ar" ? JAM_CONFIG.name_ar : JAM_CONFIG.name_en}
          </div>
          <div className="text-sm text-[color:var(--color-muted)]">
            {tr("footer_built_by")}
          </div>
        </div>

        <div>
          <div className="text-sm text-[color:var(--color-muted)] mb-2">{tr("follow_us")}</div>
          <div className="flex gap-2 flex-wrap">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="w-9 h-9 rounded-md border border-[color:var(--color-border)] grid place-items-center hover:bg-[color:var(--color-surface)] transition-colors"
              >
                <s.icon />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-[color:var(--color-muted)] py-4 border-t border-[color:var(--color-border)]">
        © {new Date().getFullYear()} {JAM_CONFIG.name_en}
      </div>
    </footer>
  );
}

const SVG = (props: { children: React.ReactNode }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    {props.children}
  </svg>
);

const DiscordIcon = () => (
  <SVG>
    <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a13.88 13.88 0 0 0-.617 1.265 18.27 18.27 0 0 0-5.882 0A13.66 13.66 0 0 0 9.442 3a19.74 19.74 0 0 0-3.76 1.369C2.06 9.756 1.07 14.999 1.557 20.166a19.94 19.94 0 0 0 6.073 3.043c.49-.66.927-1.362 1.302-2.099a12.92 12.92 0 0 1-2.05-.978c.171-.124.34-.253.502-.388 3.927 1.795 8.18 1.795 12.064 0 .163.135.331.264.502.388-.654.387-1.34.713-2.05.978.375.737.812 1.439 1.301 2.099a19.91 19.91 0 0 0 6.075-3.043c.5-5.7-.776-10.91-3.96-15.797ZM8.02 16.515c-1.182 0-2.157-1.085-2.157-2.42s.95-2.421 2.157-2.421c1.207 0 2.18 1.085 2.156 2.421-.001 1.335-.95 2.42-2.156 2.42Zm7.96 0c-1.181 0-2.156-1.085-2.156-2.42s.95-2.421 2.156-2.421c1.207 0 2.18 1.085 2.157 2.421 0 1.335-.95 2.42-2.157 2.42Z" />
  </SVG>
);

const TwitterIcon = () => (
  <SVG>
    <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.844l-5.36-7.01L4.6 22H1.342l8.05-9.193L1 2h7.018l4.846 6.4L18.244 2Zm-1.2 18h1.793L7.05 4H5.13l11.913 16Z" />
  </SVG>
);

const YouTubeIcon = () => (
  <SVG>
    <path d="M23.5 6.2c-.3-1.1-1.1-1.9-2.2-2.2C19.4 3.5 12 3.5 12 3.5s-7.4 0-9.3.5c-1.1.3-1.9 1.1-2.2 2.2C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1.1 1.1 1.9 2.2 2.2 1.9.5 9.3.5 9.3.5s7.4 0 9.3-.5c1.1-.3 1.9-1.1 2.2-2.2.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
  </SVG>
);

const InstagramIcon = () => (
  <SVG>
    <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4a3.7 3.7 0 0 1-1.4-.9 3.7 3.7 0 0 1-.9-1.4c-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.2 0-3.5 0-4.7.1-1.1 0-1.7.2-2.1.4-.5.2-.9.4-1.2.7-.3.3-.5.7-.7 1.2-.2.4-.3 1-.4 2.1C2.8 9.7 2.8 10 2.8 12s0 2.3.1 3.5c0 1.1.2 1.7.4 2.1.2.5.4.9.7 1.2.3.3.7.5 1.2.7.4.2 1 .3 2.1.4 1.2.1 1.5.1 4.7.1s3.5 0 4.7-.1c1.1 0 1.7-.2 2.1-.4.5-.2.9-.4 1.2-.7.3-.3.5-.7.7-1.2.2-.4.3-1 .4-2.1.1-1.2.1-1.5.1-3.5s0-2.3-.1-3.5c0-1.1-.2-1.7-.4-2.1a3 3 0 0 0-.7-1.2 3 3 0 0 0-1.2-.7c-.4-.2-1-.3-2.1-.4-1.2 0-1.5-.1-4.7-.1Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Zm5.1-2a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
  </SVG>
);

const FacebookIcon = () => (
  <SVG>
    <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.2v7A10 10 0 0 0 22 12Z" />
  </SVG>
);

const LinkedInIcon = () => (
  <SVG>
    <path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2ZM8 19H5V9h3v10ZM6.5 7.7A1.7 1.7 0 1 1 6.5 4.3a1.7 1.7 0 0 1 0 3.4ZM19 19h-3v-5.3c0-1.3-.5-1.9-1.5-1.9s-1.7.7-1.7 1.9V19h-3V9h2.9v1.3a3.4 3.4 0 0 1 3-1.5c2 0 3.3 1.2 3.3 3.7V19Z" />
  </SVG>
);
