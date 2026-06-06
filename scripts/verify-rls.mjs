// Verify Row Level Security is actually enforcing on the live DB.
//
// Uses ONLY the public anon key — exactly what an external attacker has access
// to. If any of these queries returns data or successfully writes, RLS is
// broken on that table.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const anon = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("=== ANON-KEY READ TESTS ===\n");

for (const table of ["participants", "theme_suggestions", "votes", "jam_phases"]) {
  const { data, error, count } = await anon
    .from(table)
    .select("*", { count: "exact", head: false })
    .limit(3);

  if (error) {
    console.log(`✅ ${table.padEnd(20)} → blocked (${error.message || error.code})`);
  } else if (!data || data.length === 0) {
    console.log(`✅ ${table.padEnd(20)} → empty result (RLS denying)  count=${count ?? "?"}`);
  } else {
    console.log(`🔴 ${table.padEnd(20)} → LEAKED ${data.length} rows  count=${count ?? "?"}`);
    console.log(`   sample row: ${JSON.stringify(data[0]).slice(0, 200)}`);
  }
}

console.log("\n=== ANON-KEY WRITE TESTS ===\n");

// Try inserting bogus row into each table
const writeTests = [
  { table: "participants", row: { email: "_rls_test@example.invalid", full_name: "RLS Test", age_group: "23_29", country: "Other", skills: ["other"], skills_other: "test", participated_before: false, editions: ["0"] } },
  { table: "theme_suggestions", row: { theme_ar: "_rls_test_", edition: 0 } },
  { table: "votes", row: { theme_id: "00000000-0000-0000-0000-000000000000", value: 1, edition: 0 } },
  { table: "jam_phases", row: { edition: 0, current_phase: "_rls_test_" } },
];

for (const { table, row } of writeTests) {
  const { error } = await anon.from(table).insert(row);
  if (error) {
    console.log(`✅ ${table.padEnd(20)} INSERT blocked (${error.message?.slice(0, 80) || error.code})`);
  } else {
    console.log(`🔴 ${table.padEnd(20)} INSERT SUCCEEDED — attacker can WRITE`);
    // Try to clean up the bogus row we just made
    if (row.email) await anon.from(table).delete().eq("email", row.email);
  }
}

console.log("\n=== ANON-KEY DELETE TESTS ===\n");

for (const table of ["participants", "theme_suggestions", "votes", "jam_phases"]) {
  // Try deleting a row that probably doesn't exist (id check) — the response
  // tells us whether the operation is permitted, even if no rows match.
  const { error, count } = await anon.from(table).delete({ count: "exact" }).eq("id", "00000000-0000-0000-0000-000000000000");
  if (error) {
    console.log(`✅ ${table.padEnd(20)} DELETE blocked (${error.message?.slice(0, 80) || error.code})`);
  } else {
    console.log(`🔴 ${table.padEnd(20)} DELETE PERMITTED  count=${count ?? "?"}  — attacker can DELETE`);
  }
}

console.log("\n=== ANON-KEY UPDATE TESTS ===\n");

for (const table of ["participants", "theme_suggestions", "votes", "jam_phases"]) {
  const { error, count } = await anon
    .from(table)
    .update({}, { count: "exact" })
    .eq("id", "00000000-0000-0000-0000-000000000000");
  if (error) {
    console.log(`✅ ${table.padEnd(20)} UPDATE blocked (${error.message?.slice(0, 80) || error.code})`);
  } else {
    console.log(`🟡 ${table.padEnd(20)} UPDATE permitted  count=${count ?? "?"}  (but 0 rows visible → 0 affected)`);
  }
}

// CRITICAL test: try to delete the existing edition-14 jam_phases row by primary key.
// If RLS is broken on jam_phases, this would actually destroy the winning-theme row.
console.log("\n=== ATTACK SIMULATION: delete the live jam_phases row ===\n");
const { error: delErr, count: delCount } = await anon
  .from("jam_phases")
  .delete({ count: "exact" })
  .eq("edition", 14);
if (delErr) {
  console.log(`✅ Blocked: ${delErr.message}`);
} else if (delCount === 0) {
  console.log(`✅ DELETE returned but affected 0 rows (RLS hid the row from anon)`);
} else {
  console.log(`🔴🔴🔴 ATTACKER DELETED ${delCount} ROWS — RLS IS BROKEN`);
}

// Same for participants — try to delete a row by email.
console.log("\n=== ATTACK SIMULATION: delete a real participant ===\n");
const { error: pErr, count: pCount } = await anon
  .from("participants")
  .delete({ count: "exact" })
  .eq("email", "danar.kayfi@gmail.com");
if (pErr) {
  console.log(`✅ Blocked: ${pErr.message}`);
} else if (pCount === 0) {
  console.log(`✅ DELETE returned but affected 0 rows (RLS hid the row from anon)`);
} else {
  console.log(`🔴🔴🔴 ATTACKER DELETED ${pCount} ROWS — RLS IS BROKEN`);
}
