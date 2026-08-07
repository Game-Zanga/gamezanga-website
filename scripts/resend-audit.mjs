// READ-ONLY audit of what Resend has actually sent.
//
// Two senders feed Resend:
//   1. /api/register  -> Resend HTTP API  (registration confirmations, broadcasts)
//   2. Supabase Auth  -> Resend SMTP      (magic-link sign-in emails)
// If (2) never appears here, Supabase is not handing sign-in emails to Resend.
//
//   node --env-file=.env.local scripts/resend-audit.mjs

const KEY = process.env.RESEND_API_KEY;
if (!KEY) throw new Error("RESEND_API_KEY not set");

const PAGES = Number(process.argv[2] ?? 20); // 20 pages x 100 = 2000 emails

const all = [];
let after = null;
for (let i = 0; i < PAGES; i++) {
  const url = new URL("https://api.resend.com/emails");
  url.searchParams.set("limit", "100");
  if (after) url.searchParams.set("after", after);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!res.ok) {
    console.error(`page ${i}: HTTP ${res.status} ${await res.text()}`);
    break;
  }
  const json = await res.json();
  const rows = json.data ?? [];
  if (!rows.length) break;
  all.push(...rows);
  if (!json.has_more) break;
  after = rows[rows.length - 1].id;
}

console.log(`Fetched ${all.length} emails\n`);

const bucket = (s) => {
  const t = (s ?? "").toLowerCase();
  if (t.includes("رابط الدخول") || t.includes("sign-in") || t.includes("sign in") || t.includes("magic"))
    return "MAGIC LINK (sign-in)";
  if (t.includes("تأكيد التسجيل") || t.includes("registration confirmed"))
    return "registration confirmation";
  return `other: ${s}`;
};

const byKind = new Map();
const byEvent = new Map();
const byDay = new Map();

for (const e of all) {
  const k = bucket(e.subject);
  const day = (e.created_at ?? "").slice(0, 10);
  byKind.set(k, (byKind.get(k) ?? 0) + 1);
  byEvent.set(e.last_event, (byEvent.get(e.last_event) ?? 0) + 1);
  const d = byDay.get(day) ?? { total: 0, failed: 0, delivered: 0, bounced: 0 };
  d.total++;
  if (e.last_event === "failed") d.failed++;
  else if (e.last_event === "delivered") d.delivered++;
  else if (e.last_event === "bounced") d.bounced++;
  byDay.set(day, d);
}

console.log("By kind:");
for (const [k, c] of [...byKind].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${String(c).padStart(5)}  ${k}`);
}

console.log("\nBy final event:");
for (const [k, c] of [...byEvent].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(c).padStart(5)}  ${k}`);
}

console.log("\nBy day (newest first):");
for (const [d, s] of [...byDay].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 20)) {
  const pct = s.total ? ((s.failed / s.total) * 100).toFixed(0) : "0";
  console.log(
    `  ${d}  total ${String(s.total).padStart(4)}  delivered ${String(s.delivered).padStart(4)}  failed ${String(s.failed).padStart(4)} (${pct}%)  bounced ${s.bounced}`
  );
}

const magic = all.filter((e) => bucket(e.subject).startsWith("MAGIC"));
console.log(`\nMagic-link emails seen in Resend: ${magic.length}`);
if (magic.length) {
  console.log("  most recent:");
  for (const m of magic.slice(0, 5)) console.log(`   ${m.created_at}  ${m.last_event}  ${m.to}`);
}
console.log(`\nNewest email overall: ${all[0]?.created_at}  (${all[0]?.subject})`);
