// READ-ONLY: who was *meant* to get a given broadcast but never did?
//
// The 2026-08-07 broadcast fired ~543 sends in one second, blew the Resend rate
// limit + daily quota, and only some were accepted. Resend only has records for
// the ones it accepted, so diffing its recipient list against the participant
// list gives the exact set that needs a resend.
//
//   node --env-file=.env.local scripts/broadcast-gap.mjs "<subject substring>" [editionTag]

import { createClient } from "@supabase/supabase-js";

const SUBJECT = process.argv[2] ?? "باقي اقل من اسبوع";
const EDITION = process.argv[3] ?? "14";

const KEY = process.env.RESEND_API_KEY;
if (!KEY) throw new Error("RESEND_API_KEY not set");

// --- everyone Resend actually accepted for this subject ---------------------
const got = new Set();
let after = null;
for (let i = 0; i < 40; i++) {
  const url = new URL("https://api.resend.com/emails");
  url.searchParams.set("limit", "100");
  if (after) url.searchParams.set("after", after);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!res.ok) { console.error(`HTTP ${res.status}`); break; }
  const json = await res.json();
  const rows = json.data ?? [];
  if (!rows.length) break;
  for (const e of rows) {
    if ((e.subject ?? "").includes(SUBJECT)) {
      for (const t of e.to ?? []) got.add(t.toLowerCase());
    }
  }
  if (!json.has_more) break;
  after = rows[rows.length - 1].id;
}

// --- everyone who should have received it ------------------------------------
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const audience = [];
for (let from = 0; ; from += 1000) {
  let q = sb
    .from("participants")
    .select("email, created_at")
    .order("created_at", { ascending: true })
    .range(from, from + 999);
  // "all" = everyone ever registered, matching the admin panel's widest target.
  if (EDITION !== "all") q = q.contains("editions", [EDITION]);
  const { data, error } = await q;
  if (error) throw error;
  if (!data?.length) break;
  audience.push(...data);
  if (data.length < 1000) break;
}

const missed = audience.filter((p) => !got.has((p.email ?? "").toLowerCase()));

console.log(`Subject filter : "${SUBJECT}"`);
console.log(`Audience (ed ${EDITION}) : ${audience.length}`);
console.log(`Accepted by Resend      : ${got.size}`);
console.log(`NEVER SENT              : ${missed.length}`);

if (missed.length) {
  const out = missed.map((m) => m.email).join("\n");
  const fs = await import("node:fs");
  fs.writeFileSync("scripts/legacy-data/broadcast-missed.txt", out + "\n");
  console.log(`\nWrote ${missed.length} addresses to scripts/legacy-data/broadcast-missed.txt (gitignored)`);
  console.log("First 10:");
  for (const m of missed.slice(0, 10)) console.log(`  ${m.email}`);
}
