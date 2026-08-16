// Arabic-friendly date formatting for the home page banner.
//
// Output format (the requested style, broadly understandable across the Arab region):
//   الخميس ١٣ اغسطس (آب) – الأحد ١٦ اغسطس (آب) ٢٠٢٦
//
// Both halves include day-of-week and month (standard Gregorian Arabic + the
// Levantine equivalent in parens). The year appears once at the end. Digits
// are Arabic-Indic.

const WEEKDAYS_AR: Record<string, string> = {
  Sunday: "الأحد",
  Monday: "الإثنين",
  Tuesday: "الثلاثاء",
  Wednesday: "الأربعاء",
  Thursday: "الخميس",
  Friday: "الجمعة",
  Saturday: "السبت",
};

// Standard Gregorian Arabic name + Levantine equivalent. Index 0 = January.
const MONTHS_AR: Array<{ standard: string; levantine: string }> = [
  { standard: "يناير",  levantine: "كانون الثاني" },
  { standard: "فبراير", levantine: "شباط" },
  { standard: "مارس",   levantine: "آذار" },
  { standard: "أبريل",  levantine: "نيسان" },
  { standard: "مايو",   levantine: "أيار" },
  { standard: "يونيو",  levantine: "حزيران" },
  { standard: "يوليو",  levantine: "تموز" },
  { standard: "اغسطس",  levantine: "آب" },
  { standard: "سبتمبر", levantine: "أيلول" },
  { standard: "أكتوبر", levantine: "تشرين الأول" },
  { standard: "نوفمبر", levantine: "تشرين الثاني" },
  { standard: "ديسمبر", levantine: "كانون الأول" },
];

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
function toArabicDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);
}

type Parts = { weekday: string; day: string; monthIdx: number; year: string };

// Extract date parts in Asia/Riyadh time. We format via en-US first to get
// stable English weekday/month names that we can map to Arabic ourselves,
// rather than rely on Intl's varying Arabic output.
function getRiyadhParts(date: Date): Parts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Riyadh",
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(date);
  const find = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    weekday: find("weekday"),
    day: find("day"),
    monthIdx: Number(find("month")) - 1,
    year: find("year"),
  };
}

function formatArabicSide(date: Date, includeYear: boolean): string {
  const { weekday, day, monthIdx, year } = getRiyadhParts(date);
  const m = MONTHS_AR[monthIdxSafe(monthIdx)]!;
  const wd = WEEKDAYS_AR[weekday] ?? weekday;
  const dayAr = toArabicDigits(day);
  const yearAr = toArabicDigits(year);
  const base = `${wd} ${dayAr} ${m.standard} (${m.levantine})`;
  return includeYear ? `${base} ${yearAr}` : base;
}

// Defensive — should never be needed, but avoids out-of-bounds if monthIdx is somehow off.
function monthIdxSafe(i: number): number {
  if (i < 0 || i > 11 || !Number.isFinite(i)) return 0;
  return i;
}

/**
 * Format the jam start/end as a single bilingual-region-friendly Arabic string.
 * Year is shown only at the end (start side has weekday+day+month+levantine).
 */
export function formatArabicDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  return `${formatArabicSide(start, false)} – ${formatArabicSide(end, true)}`;
}

/**
 * A single deadline moment, e.g. "الأحد ١٦ اغسطس (آب)، ١٠:٠٠ مساءً".
 * Used for the submission cutoff on the home page during the jam.
 */
export function formatArabicDeadline(iso: string): string {
  const d = new Date(iso);
  const { weekday, day, monthIdx } = getRiyadhParts(d);
  const m = MONTHS_AR[monthIdxSafe(monthIdx)]!;
  const wd = WEEKDAYS_AR[weekday] ?? weekday;

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Riyadh",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(d);
  const hour = time.find((p) => p.type === "hour")?.value ?? "";
  const minute = time.find((p) => p.type === "minute")?.value ?? "";
  const isAM = time.find((p) => p.type === "dayPeriod")?.value === "AM";
  const period = isAM ? "صباحاً" : "مساءً";

  // "١٢:٠٠ صباحاً" is technically correct for midnight and confusing to read —
  // deadlines land on the hour often enough to be worth naming properly.
  let clock = `${toArabicDigits(hour)}:${toArabicDigits(minute)} ${period}`;
  if (hour === "12" && minute === "00") clock = isAM ? "منتصف الليل" : "الظهر";

  return `${wd} ${toArabicDigits(day)} ${m.standard} (${m.levantine})، ${clock}`;
}

/** English equivalent of formatArabicDeadline. */
export function formatEnglishDeadline(iso: string): string {
  return new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Riyadh",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

/** English fallback — unchanged from before. */
export function formatEnglishDateRange(startISO: string, endISO: string): string {
  const fmt = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  });
  return `${fmt.format(new Date(startISO))} — ${fmt.format(new Date(endISO))}`;
}
