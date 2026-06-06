import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const all = [];
for (let from = 0; ; from += 1000) {
  const { data } = await sb
    .from("participants")
    .select("full_name, email, created_at, country, age_group, skills, editions")
    .contains("editions", ["14"])
    .order("created_at", { ascending: false })
    .range(from, from + 999);
  if (!data?.length) break;
  all.push(...data);
  if (data.length < 1000) break;
}

console.log(`Total rows tagged with edition 14: ${all.length}\n`);

// Group by today vs older
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);
const todayMs = todayStart.getTime();

const today = all.filter((r) => new Date(r.created_at).getTime() >= todayMs);
const older = all.filter((r) => new Date(r.created_at).getTime() < todayMs);

console.log(`  added today:     ${today.length}`);
console.log(`  older:           ${older.length}\n`);

// Group today's rows by name
const byName = {};
for (const r of today) byName[r.full_name] = (byName[r.full_name] ?? 0) + 1;

console.log("Today's names:");
for (const [n, c] of Object.entries(byName).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(c).padStart(4)} × "${n}"`);
}

// Look at last 30 today
console.log("\nLast 30 today (most recent first):");
for (const r of today.slice(0, 30)) {
  const t = new Date(r.created_at).toISOString().slice(11, 19);
  console.log(`  ${t}  ${r.full_name.padEnd(28)} ${r.email}`);
}
