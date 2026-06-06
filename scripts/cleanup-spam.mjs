// EMERGENCY: clean up mass-registration spam attack.
//
// Identifies fake rows by attacker's fingerprint: full_name = "DEF4AULD LZELKFE"
// All spam rows have this exact name. Profile-hijacking fix means real returning
// participants would NOT have had their name overwritten, so name match alone
// reliably identifies attack rows.
//
// Usage:
//   node --env-file=.env.local scripts/cleanup-spam.mjs --dry-run
//   node --env-file=.env.local scripts/cleanup-spam.mjs

import { createClient } from "@supabase/supabase-js";

const dryRun = process.argv.includes("--dry-run");
const SPAM_NAME = "DEF4AULD LZELKFE";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log(`[${dryRun ? "DRY-RUN" : "DELETING"}] Hunting spam rows where full_name = "${SPAM_NAME}"\n`);

// ─── 1. Fetch all spam rows ─────────────────────────────────────────
async function fetchAllSpam() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("participants")
      .select("id, email, full_name, created_at, editions")
      .eq("full_name", SPAM_NAME)
      .range(from, from + 999);
    if (error) { console.error("Lookup failed:", error); process.exit(1); }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
    process.stdout.write(`  fetched ${all.length}…\r`);
  }
  return all;
}

const spam = await fetchAllSpam();
console.log(`\nFound ${spam.length} spam rows in participants table.\n`);

if (spam.length === 0) {
  console.log("Nothing to clean up.");
  process.exit(0);
}

console.log("Sample (first 5 emails):");
for (const r of spam.slice(0, 5)) {
  console.log(`  ${r.email}`);
}

// Build a Set of emails for fast lookup during auth-user cleanup.
const spamEmails = new Set(spam.map((r) => r.email.toLowerCase()));

if (dryRun) {
  console.log(`\n[DRY-RUN] Would delete:`);
  console.log(`  - ${spam.length} rows from participants`);
  console.log(`  - up to ${spam.length} corresponding auth users`);
  console.log(`Re-run without --dry-run to actually delete.`);
  process.exit(0);
}

// ─── 2. Delete participants in batches ──────────────────────────────
console.log(`\nDeleting ${spam.length} rows from participants table…`);
const BATCH = 200;
let deletedParticipants = 0;
for (let i = 0; i < spam.length; i += BATCH) {
  const ids = spam.slice(i, i + BATCH).map((r) => r.id);
  const { error } = await sb.from("participants").delete().in("id", ids);
  if (error) {
    console.error(`Batch ${i}–${i + BATCH} failed:`, error);
    break;
  }
  deletedParticipants += ids.length;
  process.stdout.write(`  ${deletedParticipants}/${spam.length}\r`);
}
console.log(`\n✅ Deleted ${deletedParticipants} participant rows.\n`);

// ─── 3. Walk Supabase Auth users in pages and delete matching emails ────
console.log(`Scanning Supabase Auth users and deleting matches…`);
let authPage = 1;
const PER_PAGE = 1000;
let authDeleted = 0;
let authFailed = 0;
let authScanned = 0;

while (true) {
  const { data, error } = await sb.auth.admin.listUsers({ page: authPage, perPage: PER_PAGE });
  if (error) {
    console.error(`listUsers page ${authPage} failed:`, error);
    break;
  }
  const users = data.users ?? [];
  if (users.length === 0) break;
  authScanned += users.length;

  for (const user of users) {
    const email = (user.email || "").toLowerCase();
    if (!email || !spamEmails.has(email)) continue;
    try {
      const { error: delErr } = await sb.auth.admin.deleteUser(user.id);
      if (delErr) authFailed++;
      else authDeleted++;
    } catch {
      authFailed++;
    }
    if ((authDeleted + authFailed) % 100 === 0) {
      process.stdout.write(`  scanned ${authScanned} · deleted ${authDeleted} · failed ${authFailed}\r`);
    }
  }
  if (users.length < PER_PAGE) break;
  authPage++;
}

console.log(`\n\n──────────────── DONE ────────────────`);
console.log(`  Participants deleted: ${deletedParticipants}`);
console.log(`  Auth users scanned:   ${authScanned}`);
console.log(`  Auth users deleted:   ${authDeleted}`);
console.log(`  Auth deletions failed: ${authFailed}`);

if (authDeleted < spam.length * 0.8) {
  console.log(`\n⚠  Fewer auth users deleted than spam rows — some may have been`);
  console.log(`   created without auth (e.g. /api/register failed at auth step) or`);
  console.log(`   you're on a higher page that needs another run.`);
}
