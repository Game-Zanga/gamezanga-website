// Final standings for edition 14, shown on the home page once the results
// premiere has aired. Ranking and the special awards come from the organisers'
// judging; covers are the games' own itch.io art.
//
// Next year: move this to RESULTS_BY_EDITION keyed on the edition number, or
// archive it alongside PAST_EDITIONS — do not overwrite it.

export type ResultEntry = {
  rank: number;
  name: string;
  dev: string;
  country: string;
  /** Special category win, if any (e.g. best visuals). */
  award_ar?: string;
  /** itch.io rating page for the entry. */
  url: string;
  cover: string;
};

export const TOP_GAMES: ResultEntry[] = [
  {
    rank: 1,
    name: "ابواب - لو خيروك",
    dev: "Abedalkareem",
    country: "الامارات",
    url: "https://itch.io/jam/gamezanga14/rate/4900895",
    cover: "/images/results/gz14/01.jpg",
  },
  {
    rank: 2,
    name: "There is a monester in my closet",
    dev: "ibra147",
    country: "السعودية",
    award_ar: "الأفضل في استخدام موضوع الزنقة",
    url: "https://itch.io/jam/gamezanga14/rate/4904159",
    cover: "/images/results/gz14/02.jpg",
  },
  {
    rank: 3,
    name: "حلم بدر / Badr's Dream",
    dev: "EizAldeen",
    country: "الاردن",
    award_ar: "الأفضل في الصوتيات والمؤثرات الصوتية",
    url: "https://itch.io/jam/gamezanga14/rate/4903445",
    cover: "/images/results/gz14/03.jpg",
  },
  {
    rank: 4,
    name: "مستيقظ أم لا؟",
    dev: "Sop, SPY",
    country: "السعودية",
    url: "https://itch.io/jam/gamezanga14/rate/4904113",
    cover: "/images/results/gz14/04.jpg",
  },
  {
    rank: 5,
    name: "كاتب الأحلام Dream Writer",
    dev: "Malek, Marwan, Omar, Osama, Mad, Raghad",
    country: "الاردن",
    award_ar: "الأفضل في الرسوميات",
    url: "https://itch.io/jam/gamezanga14/rate/4895780",
    cover: "/images/results/gz14/05.jpg",
  },
  {
    rank: 6,
    name: "REVERIE",
    dev: "Snowy",
    country: "قطر والسعودية",
    url: "https://itch.io/jam/gamezanga14/rate/4903940",
    cover: "/images/results/gz14/06.jpg",
  },
  {
    rank: 7,
    name: "منبه",
    dev: "3anter",
    country: "الجزائر",
    award_ar: "الأفضل في استخدام موضوع الزنقة",
    url: "https://itch.io/jam/gamezanga14/rate/4904191",
    cover: "/images/results/gz14/07.jpg",
  },
  {
    rank: 8,
    name: "Dream Drift",
    dev: "frozen-moon",
    country: "تونس والجزائر",
    award_ar: "الأفضل في عامل التسلية والاستمتاع",
    url: "https://itch.io/jam/gamezanga14/rate/4903090",
    cover: "/images/results/gz14/08.jpg",
  },
  {
    rank: 9,
    name: "Oneirophobia",
    dev: "ZAYgt",
    country: "مصر",
    url: "https://itch.io/jam/gamezanga14/rate/4903826",
    cover: "/images/results/gz14/09.jpg",
  },
  {
    rank: 10,
    name: "Dreams Scraps",
    dev: "nab_ttmn",
    country: "الجزائر",
    award_ar: "الأفضل في الإبداع",
    url: "https://itch.io/jam/gamezanga14/rate/4903725",
    cover: "/images/results/gz14/10.jpg",
  },
];
