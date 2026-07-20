// Pull real participant stats for the media kit / partnership deck.
// Read-only. Run: node --env-file=.env.local scripts/media-kit-stats.mjs
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fetchAll() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("participants")
      .select("email, country, country_other, age_group, skills, gender, participated_before, editions")
      .range(from, from + 999);
    if (error) { console.error(error); process.exit(1); }
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all;
}

const rows = await fetchAll();
console.log("TOTAL UNIQUE PARTICIPANTS:", rows.length);

// --- by edition ---
const byEd = {};
for (const r of rows) for (const e of (r.editions ?? [])) byEd[e] = (byEd[e] ?? 0) + 1;
console.log("\n=== BY EDITION ===");
Object.entries(byEd).sort((a,b) => {
  const na = a[0] === "SE" ? 13.5 : +a[0], nb = b[0] === "SE" ? 13.5 : +b[0];
  return nb - na;
}).forEach(([e,c]) => console.log(`  Edition ${e.padEnd(3)} ${c}`));

// --- returning participants ---
const multi = rows.filter(r => (r.editions ?? []).length > 1).length;
const tri  = rows.filter(r => (r.editions ?? []).length > 2).length;
console.log(`\n=== LOYALTY ===`);
console.log(`  joined 2+ editions: ${multi} (${(100*multi/rows.length).toFixed(1)}%)`);
console.log(`  joined 3+ editions: ${tri} (${(100*tri/rows.length).toFixed(1)}%)`);
const before = rows.filter(r => r.participated_before === true).length;
console.log(`  self-reported "participated before": ${before} (${(100*before/rows.length).toFixed(1)}%)`);

// --- countries ---
const country = {};
for (const r of rows) {
  const k = r.country === "Other" ? (r.country_other?.trim() || "Other") : r.country;
  if (!k) continue;
  country[k] = (country[k] ?? 0) + 1;
}
const sortedC = Object.entries(country).sort((a,b) => b[1]-a[1]);
console.log(`\n=== COUNTRIES (${sortedC.length} distinct values) ===`);
sortedC.slice(0, 25).forEach(([k,c]) =>
  console.log(`  ${String(c).padStart(5)}  ${(100*c/rows.length).toFixed(1).padStart(5)}%  ${k}`));

// --- age ---
const AGE_ORDER = ["under_18","18_22","23_29","30_39","over_40"];
const age = {};
for (const r of rows) if (r.age_group) age[r.age_group] = (age[r.age_group] ?? 0) + 1;
console.log(`\n=== AGE ===`);
AGE_ORDER.forEach(a => { if(age[a]) console.log(`  ${a.padEnd(9)} ${String(age[a]).padStart(5)}  ${(100*age[a]/rows.length).toFixed(1)}%`); });

// --- skills (multi-select, so counts exceed total) ---
const skill = {};
for (const r of rows) for (const s of (r.skills ?? [])) skill[s] = (skill[s] ?? 0) + 1;
console.log(`\n=== SKILLS (multi-select) ===`);
Object.entries(skill).sort((a,b)=>b[1]-a[1]).forEach(([k,c]) =>
  console.log(`  ${k.padEnd(12)} ${String(c).padStart(5)}  ${(100*c/rows.length).toFixed(1)}%`));

// --- gender ---
const g = {};
for (const r of rows) { const k = r.gender || "unspecified"; g[k] = (g[k] ?? 0) + 1; }
console.log(`\n=== GENDER ===`);
Object.entries(g).sort((a,b)=>b[1]-a[1]).forEach(([k,c]) =>
  console.log(`  ${k.padEnd(12)} ${String(c).padStart(5)}  ${(100*c/rows.length).toFixed(1)}%`));
