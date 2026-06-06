// Full post-attack cleanup:
//   1. Delete remaining spam participants by name pattern + UUID-email pattern.
//   2. Delete all orphan auth users (whose email isn't in participants).
//
// Safety: only deletes auth users with NO matching participant row, so even if
// the spam pattern detection misses something, real users stay intact.
//
// Usage:
//   node --env-file=.env.local scripts/cleanup-full.mjs --dry-run
//   node --env-file=.env.local scripts/cleanup-full.mjs

import { createClient } from "@supabase/supabase-js";

const dryRun = process.argv.includes("--dry-run");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const UUID_EMAIL_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}@/i;

// Names that are unambiguously spam (insults, gibberish, etc.)
const SPAM_NAMES = ["عمك يحرق دمك"];

console.log(`[${dryRun ? "DRY-RUN" : "DELETING"}] Full post-attack cleanup\n`);

// ─── PHASE 1: Clean up remaining spam participant rows ──────────────
console.log("Phase 1 — find remaining spam participants…");

async function fetchAllParticipants() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("participants")
      .select("id, email, full_name")
      .range(from, from + 999);
    if (error || !data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all;
}

const participants = await fetchAllParticipants();
console.log(`  Total participants: ${participants.length}`);

const spamParts = participants.filter(
  (r) => SPAM_NAMES.includes(r.full_name) || UUID_EMAIL_RE.test(r.email)
);
console.log(`  Spam participants to delete: ${spamParts.length}`);
if (spamParts.length > 0) {
  console.log("  Sample:");
  for (const r of spamParts.slice(0, 5)) {
    console.log(`    "${r.full_name}" → ${r.email}`);
  }
}

if (!dryRun && spamParts.length > 0) {
  const BATCH = 200;
  let deleted = 0;
  for (let i = 0; i < spamParts.length; i += BATCH) {
    const ids = spamParts.slice(i, i + BATCH).map((r) => r.id);
    const { error } = await sb.from("participants").delete().in("id", ids);
    if (error) { console.error("delete failed:", error); break; }
    deleted += ids.length;
  }
  console.log(`  ✅ Deleted ${deleted} spam participant rows.`);
}

// Re-fetch fresh participant list after spam deletion (so orphan calculation
// reflects post-cleanup state).
const validParticipants = dryRun
  ? participants.filter((r) => !spamParts.some((s) => s.id === r.id))
  : await fetchAllParticipants();
const validEmails = new Set(validParticipants.map((r) => r.email.toLowerCase()));
console.log(`\n  Valid participants after spam cleanup: ${validEmails.size}\n`);

// ─── PHASE 2: Find + delete orphan auth users ───────────────────────
console.log("Phase 2 — scanning Supabase Auth for orphan users…");

let authPage = 1;
const PER_PAGE = 1000;
let authScanned = 0;
const orphanIds = [];

while (true) {
  const { data, error } = await sb.auth.admin.listUsers({ page: authPage, perPage: PER_PAGE });
  if (error) { console.error(`listUsers page ${authPage} failed:`, error); break; }
  const users = data.users ?? [];
  if (users.length === 0) break;
  authScanned += users.length;

  for (const user of users) {
    const email = (user.email || "").toLowerCase();
    if (!email) continue;
    if (!validEmails.has(email)) orphanIds.push(user.id);
  }
  process.stdout.write(`  page ${authPage} · scanned ${authScanned} · orphans ${orphanIds.length}\r`);
  if (users.length < PER_PAGE) break;
  authPage++;
}
console.log(`\n  Scanned ${authScanned} auth users, ${orphanIds.length} are orphans.`);

if (dryRun) {
  console.log(`\n[DRY-RUN] Summary:`);
  console.log(`  Would delete ${spamParts.length} participants`);
  console.log(`  Would delete ${orphanIds.length} orphan auth users`);
  console.log(`  Re-run without --dry-run to actually delete.`);
  process.exit(0);
}

// Parallel auth deletes
console.log(`\nDeleting ${orphanIds.length} orphan auth users with concurrency=20…`);
const CONCURRENCY = 20;
let authDeleted = 0;
let authFailed = 0;
for (let i = 0; i < orphanIds.length; i += CONCURRENCY) {
  const batch = orphanIds.slice(i, i + CONCURRENCY);
  const results = await Promise.allSettled(batch.map((id) => sb.auth.admin.deleteUser(id)));
  for (const r of results) {
    if (r.status === "fulfilled" && !r.value.error) authDeleted++;
    else authFailed++;
  }
  if ((authDeleted + authFailed) % 500 === 0 || authDeleted + authFailed === orphanIds.length) {
    process.stdout.write(`  ${authDeleted + authFailed}/${orphanIds.length}\r`);
  }
}

console.log(`\n\n──────────────── DONE ────────────────`);
console.log(`  Spam participants deleted:  ${spamParts.length}`);
console.log(`  Orphan auth users deleted:  ${authDeleted}`);
console.log(`  Orphan auth delete failures: ${authFailed}`);
console.log(`  Remaining real participants: ${validEmails.size}`);
