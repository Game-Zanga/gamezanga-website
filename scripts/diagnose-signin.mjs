// READ-ONLY diagnostic for the "I don't get the sign-in email" reports.
//
// Sign-in uses signInWithOtp({ shouldCreateUser: false }), so a participant with
// no row in auth.users can never be sent a magic link — Supabase rejects with
// "Signups not allowed for otp" instead.
//
//   node --env-file=.env.local <this file>

import { createClient } from "@supabase/supabase-js";

const EDITION = "14";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// --- 1. every participant tagged with the current edition -------------------
const participants = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb
    .from("participants")
    .select("email, full_name, created_at, editions")
    .contains("editions", [EDITION])
    .range(from, from + 999);
  if (error) throw error;
  if (!data?.length) break;
  participants.push(...data);
  if (data.length < 1000) break;
}

// --- 2. every participant ever (for context) --------------------------------
const { count: totalParticipants } = await sb
  .from("participants")
  .select("*", { count: "exact", head: true });

// --- 3. every auth user (paginated admin API) -------------------------------
const authEmails = new Set();
const authByEmail = new Map();
for (let page = 1; ; page++) {
  const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  const users = data?.users ?? [];
  if (!users.length) break;
  for (const u of users) {
    if (!u.email) continue;
    const e = u.email.toLowerCase();
    authEmails.add(e);
    authByEmail.set(e, u);
  }
  if (users.length < 1000) break;
}

// --- 4. cross-reference ------------------------------------------------------
const missing = [];
const unconfirmed = [];
for (const p of participants) {
  const e = (p.email ?? "").toLowerCase();
  const u = authByEmail.get(e);
  if (!u) {
    missing.push(p);
  } else if (!u.email_confirmed_at && !u.confirmed_at) {
    unconfirmed.push({ email: e, created_at: u.created_at });
  }
}

console.log(`Participants (all editions):        ${totalParticipants}`);
console.log(`Participants tagged "${EDITION}":              ${participants.length}`);
console.log(`Auth users total:                   ${authEmails.size}`);
console.log("");
console.log(`Edition-${EDITION} participants WITHOUT an auth user: ${missing.length}`);
console.log(`  -> these can never receive a magic link (shouldCreateUser:false)`);
console.log(`Edition-${EDITION} auth users not email-confirmed:    ${unconfirmed.length}`);

if (missing.length) {
  const pct = ((missing.length / participants.length) * 100).toFixed(1);
  console.log(`\n  = ${pct}% of edition-${EDITION} participants are locked out of sign-in.`);
  console.log("\n  First 20 affected:");
  for (const p of missing.slice(0, 20)) {
    console.log(`   - ${p.email}  (registered ${p.created_at?.slice(0, 10)}, editions ${JSON.stringify(p.editions)})`);
  }

  // When did the affected people register? A date cluster points at a window
  // where auth.admin.createUser was failing.
  const byDay = new Map();
  for (const p of missing) {
    const d = (p.created_at ?? "").slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  console.log("\n  Affected registrations by day (top 15):");
  for (const [d, c] of [...byDay.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    console.log(`   ${d}  ${c}`);
  }

  // Are they new registrants or legacy people re-registering?
  const legacy = missing.filter((p) => (p.editions ?? []).length > 1).length;
  console.log(`\n  Of the affected: ${legacy} are multi-edition (legacy import), ${missing.length - legacy} are edition-${EDITION}-only.`);
}
