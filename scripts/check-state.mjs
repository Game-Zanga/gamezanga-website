// Quick state check after the attack.
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// 1. Total participants
const { count: total } = await sb.from("participants").select("*", { count: "exact", head: true });
console.log(`Total participants in DB: ${total}`);

// 2. Sample latest 10 by created_at
const { data: latest } = await sb
  .from("participants")
  .select("full_name, email, created_at, editions")
  .order("created_at", { ascending: false })
  .limit(10);
console.log("\nLatest 10 participants:");
for (const r of latest ?? []) {
  console.log(`  ${(r.full_name || "").padEnd(25)} ${r.email.padEnd(50)} ${r.created_at}`);
}

// 3. Count by name patterns
for (const namePattern of ["DEF4AULD%", "%DEF4%", "%LZELKFE%"]) {
  const { count } = await sb
    .from("participants")
    .select("*", { count: "exact", head: true })
    .ilike("full_name", namePattern);
  console.log(`\n  name ilike '${namePattern}' → ${count} rows`);
}

// 4. Count auth users (sample first page)
const { data: authPage1 } = await sb.auth.admin.listUsers({ page: 1, perPage: 1 });
// listUsers doesn't return total; let's count by paginating just enough to estimate
let authTotalEstimate = 0;
for (let p = 1; p <= 100; p++) {
  const { data } = await sb.auth.admin.listUsers({ page: p, perPage: 1000 });
  if (!data?.users?.length) break;
  authTotalEstimate += data.users.length;
  if (data.users.length < 1000) break;
}
console.log(`\nApprox auth users: ${authTotalEstimate}`);
