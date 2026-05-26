export const JAM_CONFIG = {
  edition: 14,
  name_ar: "زنقة الألعاب",
  name_en: "Game Zanga",
  tagline_ar: "فعالية تطوير الألعاب العربية",
  tagline_en: "Arab Game Development Event",

  // Jam dates (Saudi time = UTC+3)
  jam_start: "2026-07-02T20:00:00+03:00", // Thursday 8pm
  jam_end: "2026-07-05T22:00:00+03:00", // Sunday 10pm

  // Phase dates
  registration_open: "2026-05-25T00:00:00+03:00", // placeholder — adjust
  registration_close: "2026-07-05T23:59:00+03:00", // open through 5 Jul (during the jam)
  suggestion_open: "2026-05-27T00:00:00+03:00", // open now
  suggestion_close: "2026-06-15T23:59:00+03:00", // open through 15 Jun
  voting_open: "2026-06-19T00:00:00+03:00", // TBD
  voting_close: "2026-06-28T23:59:00+03:00", // TBD
  theme_announced: "2026-07-02T20:00:00+03:00", // = jam_start

  // Links
  itchio_url: "https://itch.io/jam/gamezanga14",
  discord_url: "https://discord.gg/xvxEPtrzgu",

  // Social
  twitter_url: "https://twitter.com/GameZanga",
  youtube_url: "https://www.youtube.com/@gamezanga",
  linkedin_url: "https://www.linkedin.com/company/gamezanga",
  instagram_url: "https://www.instagram.com/gamezanga/",
  facebook_url: "https://www.facebook.com/GameZanga",

  // The announced theme — leave "" until announcement.
  announced_theme_ar: "",
  announced_theme_en: "",

  max_suggestions_per_user: 3,
  themes_in_voting: 10,
} as const;

export type JamConfig = typeof JAM_CONFIG;

export const PAST_EDITIONS = [
  {
    edition: 13,
    year: 2025,
    itchio_url: "https://itch.io/jam/gamezanga13",
    theme_ar: "",
    theme_en: "",
  },
  {
    edition: 12,
    year: 2024,
    itchio_url: "https://itch.io/jam/gamezanga12",
    theme_ar: "",
    theme_en: "",
  },
  {
    edition: 11,
    year: 2023,
    itchio_url: "https://itch.io/jam/gamezanga11",
    theme_ar: "",
    theme_en: "",
  },
  {
    edition: 10,
    year: 2022,
    itchio_url: "https://itch.io/jam/gamezanga10",
    theme_ar: "",
    theme_en: "",
  },
];
