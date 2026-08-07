// Insert organiser-curated theme suggestions into the review queue as PENDING.
//
// Skips anything already present (matched on normalised Arabic or English text)
// so re-running is safe.
//
//   node --env-file=.env.local scripts/add-theme-suggestions.mjs --dry-run
//   node --env-file=.env.local scripts/add-theme-suggestions.mjs

import { createClient } from "@supabase/supabase-js";

const dryRun = process.argv.includes("--dry-run");
const EDITION = 14;

const THEMES = [
  { ar: "عتبة",            en: "Threshold" },
  { ar: "كلّنا سجناء",      en: "We Are All Prisoners" },
  { ar: "شرخ",             en: "Fracture" },
  { ar: "تيار خفي",         en: "Undertow" },
  { ar: "أحلام",           en: "Dreams" },
  { ar: "رباط",            en: "Tether" },
  { ar: "الترابط",          en: "Interconnected" },
  { ar: "جوف",             en: "Hollow" },
  { ar: "هجرة",            en: "Migration" },
  { ar: "داخل الصندوق",     en: "Inside the Box" },
];

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Normalise for comparison: strip tashkeel/diacritics, unify alef/ya/ta-marbuta,
// collapse whitespace, lowercase. Catches "الترابط" vs "ترابط" only partially —
// so we also compare with the definite article stripped.
function norm(s) {
  return (s ?? "")
    .toString()
    .normalize("NFKD")
    .replace(/[ً-ْٰـ]/g, "") // tashkeel + tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
const stripAl = (s) => norm(s).replace(/^ال/, "");

async function fetchExisting() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("theme_suggestions")
      .select("id, theme_ar, theme_en, approved")
      .eq("edition", EDITION)
      .range(from, from + 999);
    if (error) { console.error("lookup failed:", error); process.exit(1); }
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all;
}

const existing = await fetchExisting();
console.log(`[${dryRun ? "DRY-RUN" : "INSERTING"}] edition ${EDITION} — ${existing.length} suggestions already in the queue\n`);

const arKeys = new Set(existing.map((r) => stripAl(r.theme_ar)));
const enKeys = new Set(existing.filter((r) => r.theme_en).map((r) => norm(r.theme_en)));

// Duplicates get REPLACED: the old row is deleted and the curated pair inserted,
// so the queue ends up with one clean entry per theme.
const replacing = [];
for (const t of THEMES) {
  const match = existing.find(
    (r) => stripAl(r.theme_ar) === stripAl(t.ar) || (r.theme_en && norm(r.theme_en) === norm(t.en))
  );
  if (match) replacing.push({ ...t, match });
}

// Deleting a suggestion cascades to its votes — check before destroying anything.
let voteBlock = false;
if (replacing.length) {
  const ids = replacing.map((r) => r.match.id);
  const { data: votes, error: vErr } = await sb
    .from("votes")
    .select("theme_id")
    .in("theme_id", ids);
  if (vErr) { console.error("vote check failed:", vErr); process.exit(1); }

  const perTheme = {};
  for (const v of votes ?? []) perTheme[v.theme_id] = (perTheme[v.theme_id] ?? 0) + 1;

  console.log("Duplicates — old row will be deleted and replaced:");
  for (const r of replacing) {
    const state =
      r.match.approved === true ? "approved" : r.match.approved === false ? "rejected" : "pending";
    const n = perTheme[r.match.id] ?? 0;
    if (n > 0) voteBlock = true;
    console.log(
      `  old: "${r.match.theme_ar}" / ${r.match.theme_en ?? "—"}  [${state}]  votes=${n}\n` +
      `  new: "${r.ar}" / ${r.en}  [pending]`
    );
  }
  console.log();

  if (voteBlock) {
    console.error("⛔ One or more duplicates already carry votes. Deleting them would");
    console.error("   destroy those votes (ON DELETE CASCADE). Aborting — resolve manually.");
    process.exit(1);
  }
}

console.log(`Will delete ${replacing.length} old row(s), then insert all ${THEMES.length} as pending.`);

if (dryRun) {
  console.log("\nDry run — nothing written. Re-run without --dry-run to apply.");
  process.exit(0);
}

if (replacing.length) {
  const { error: delErr } = await sb
    .from("theme_suggestions")
    .delete()
    .in("id", replacing.map((r) => r.match.id));
  if (delErr) { console.error("\ndelete failed:", delErr); process.exit(1); }
  console.log(`🗑  Deleted ${replacing.length} superseded row(s).`);
}

const { data, error } = await sb
  .from("theme_suggestions")
  .insert(
    THEMES.map((t) => ({
      theme_ar: t.ar,
      theme_en: t.en,
      approved: null,        // pending review
      edition: EDITION,
      participant_id: null,  // organiser-curated, not a participant submission
    }))
  )
  .select("id, theme_ar");

if (error) { console.error("\ninsert failed:", error); process.exit(1); }
console.log(`✅ Inserted ${data.length} suggestions as pending.`);
