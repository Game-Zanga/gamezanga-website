// Find all spam patterns by examining the data, not assuming a fixed name.
//
// Spam fingerprints we'll search for:
//   1. Email matches UUID format `<8>-<4>-<4>-<4>-<12>@<domain>` (bot-generated)
//   2. Email uses known disposable-mail domains (brixozu, fixscal, etc.)
//   3. Duplicate full_name with many occurrences (legitimate names are rare repeats)

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// 1. Names that occur many times (spam patterns reuse the same name)
console.log("Top 20 most-repeated names:");
async function fetchAll() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("participants")
      .select("full_name, email, created_at")
      .range(from, from + 999);
    if (error || !data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all;
}

const rows = await fetchAll();
console.log(`Total rows fetched: ${rows.length}\n`);

const nameCounts = {};
for (const r of rows) nameCounts[r.full_name] = (nameCounts[r.full_name] ?? 0) + 1;
const repeated = Object.entries(nameCounts)
  .filter(([, n]) => n > 1)
  .sort((a, b) => b[1] - a[1]);
for (const [name, n] of repeated.slice(0, 20)) {
  console.log(`  ${String(n).padStart(6)} × "${name}"`);
}

// 2. Count rows where email matches UUID pattern
const UUID_EMAIL_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}@/i;
const uuidEmails = rows.filter((r) => UUID_EMAIL_RE.test(r.email));
console.log(`\nRows with UUID-format emails: ${uuidEmails.length}`);
if (uuidEmails.length > 0) {
  console.log("  sample:");
  for (const r of uuidEmails.slice(0, 5)) {
    console.log(`    ${r.full_name} → ${r.email}`);
  }
}

// 3. Suspicious email domains (anything not gmail/outlook/hotmail/yahoo/icloud/aol/etc.)
const COMMON = new Set(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "aol.com", "live.com", "me.com", "protonmail.com", "proton.me", "yandex.com", "yandex.ru", "mail.ru", "qq.com"]);
const domainCounts = {};
for (const r of rows) {
  const d = r.email.split("@")[1]?.toLowerCase() ?? "";
  if (!COMMON.has(d)) domainCounts[d] = (domainCounts[d] ?? 0) + 1;
}
const suspiciousDomains = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]).slice(0, 20);
console.log("\nNon-mainstream email domains (top 20):");
for (const [d, n] of suspiciousDomains) {
  console.log(`  ${String(n).padStart(6)} × @${d}`);
}
