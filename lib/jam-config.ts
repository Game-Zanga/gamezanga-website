export const JAM_CONFIG = {
  edition: 14,
  name_ar: "زنقة الألعاب",
  name_en: "Game Zanga",
  tagline_ar: "فعالية تطوير الألعاب العربية",
  tagline_en: "Arab Game Development Event",

  // Jam dates (Saudi time = UTC+3)
  jam_start: "2026-08-13T20:00:00+03:00", // Thursday 8pm
  jam_end: "2026-08-16T23:00:00+03:00", // Sunday 11pm (extended twice on the night)

  // Phase dates
  registration_open: "2026-05-25T00:00:00+03:00",
  registration_close: "2026-08-16T23:00:00+03:00", // tracks jam_end — open through end of jam
  suggestion_open: "2026-05-27T00:00:00+03:00",
  suggestion_close: "2026-07-22T00:00:00+03:00",
  voting_open: "2026-07-30T00:00:00+03:00",
  voting_close: "2026-08-12T00:00:00+03:00",
  theme_announced: "2026-08-13T20:00:00+03:00", // = jam_start

  // itch.io rating window. Opens the moment submissions close (= jam_end) and
  // runs until this date — must match the jam's "Voting end date" on itch.io.
  rating_close: "2026-08-23T20:00:00+03:00", // Sunday 23 Aug, 8pm

  // Results premiere — the stream that closes the edition. Until it starts the
  // site links to it so people can hit "Notify me"; after, it embeds inline.
  results_announced: "2026-08-26T20:00:00+03:00", // Wednesday 8pm
  results_video_id: "bgkFsOczNTQ",

  // Closing figures for the wrap-up block. `registered` and `countries` come
  // from the participants table (countries deduped across the free-text
  // "Other" answers); `games` is the entry count on the itch.io jam page.
  edition_stats: {
    registered: 1037,
    countries: 25,
    games: 158,
  },

  // Next edition — drives the save-the-date block and, once the results are
  // out, the home page countdown. Promote these into the main fields next year.
  next_edition: {
    edition: 15,
    jam_start: "2027-07-15T20:00:00+03:00", // 8pm
    jam_end: "2027-07-18T22:00:00+03:00",   // 10pm
    // Registration is open immediately — ahead of the edition-14 results, so the
    // form is already live when the save-the-date block appears. Theme
    // suggestion and voting windows are deliberately absent: those get
    // announced later, and until they exist /suggest and /vote stay closed.
    registration_open: "2026-08-25T00:00:00+03:00",
    registration_close: "2027-07-18T22:00:00+03:00", // = jam_end
  },

  // Links
  itchio_url: "https://itch.io/jam/gamezanga14",
  discord_url: "https://discord.gg/xvxEPtrzgu",

  // Theme-announcement video. Just the YouTube ID — the home page builds the
  // youtube-nocookie embed URL from it. Leave "" to hide the player entirely.
  announcement_video_id: "NDm79oD9Aa0",

  // Social
  twitter_url: "https://twitter.com/GameZanga",
  youtube_url: "https://www.youtube.com/@gamezanga",
  linkedin_url: "https://www.linkedin.com/company/gamezanga",
  instagram_url: "https://www.instagram.com/gamezanga/",
  facebook_url: "https://www.facebook.com/GameZanga",

  // The announced theme — leave "" until announcement.
  announced_theme_ar: "أحلام",
  announced_theme_en: "Dreams",

  max_suggestions_per_user: 3,
  themes_in_voting: 10,
} as const;

export type JamConfig = typeof JAM_CONFIG;

// Past editions, newest first. `edition: null` means a non-numbered special edition.
// Posters are hosted locally in /public/images/editions/.
export type PastEdition = {
  edition: number | null;
  year: number;
  label_ar?: string;       // override the auto-formatted "النسخة N" label
  label_en?: string;       // override the auto-formatted "Edition N" label
  poster_url: string;
  itchio_url?: string;
  theme_ar?: string;
  theme_en?: string;
};

export const PAST_EDITIONS: PastEdition[] = [
  {
    edition: 13,
    year: 2025,
    itchio_url: "https://itch.io/jam/gamezanga13",
    poster_url: "/images/editions/gz13.jpg",
  },
  {
    edition: null,
    year: 2024,
    label_ar: "النسخة الخاصة",
    label_en: "Special Edition",
    itchio_url: "https://itch.io/jam/gamezanga-specialedition",
    poster_url: "/images/editions/gz-special-2024.jpg",
  },
  {
    edition: 12,
    year: 2023,
    itchio_url: "https://itch.io/jam/gamezanga12",
    poster_url: "/images/editions/gz12.jpg",
  },
  {
    edition: 11,
    year: 2022,
    itchio_url: "https://itch.io/jam/gamezanga11",
    poster_url: "/images/editions/gz11.jpg",
  },
  {
    edition: 10,
    year: 2020,
    itchio_url: "https://itch.io/jam/gamezanga10",
    poster_url: "/images/editions/gz10.jpg",
  },
  {
    edition: 9,
    year: 2019,
    itchio_url: "https://itch.io/jam/gamezanga9",
    poster_url: "/images/editions/gz9.jpg",
  },
  {
    edition: 8,
    year: 2018,
    itchio_url: "https://itch.io/jam/gamezanga8",
    poster_url: "/images/editions/gz8.jpg",
  },
  {
    edition: 7,
    year: 2017,
    itchio_url: "https://itch.io/jam/gamezanga7",
    poster_url: "/images/editions/gz7.jpg",
  },
  {
    edition: 6,
    year: 2016,
    itchio_url: "https://itch.io/jam/game-zanga-6",
    poster_url: "/images/editions/gz6.jpg",
  },
  {
    edition: 5,
    year: 2015,
    itchio_url: "https://itch.io/jam/game-zanga-5",
    poster_url: "/images/editions/gz5.jpg",
  },
  {
    edition: 4,
    year: 2014,
    poster_url: "/images/editions/gz4.jpg",
  },
  {
    edition: 3,
    year: 2013,
    poster_url: "/images/editions/gz3.jpg",
  },
  {
    edition: 2,
    year: 2012,
    poster_url: "/images/editions/gz2.jpg",
  },
  {
    edition: 1,
    year: 2011,
    poster_url: "/images/editions/gz1.jpg",
  },
];
