// One-shot cleanup:
//   1. Merge danar.kayfi@gmai.com (SE) into danar.kayfi@gmail.com, also add "13"
//   2. Fix hanitsermohamed5@gmai.com and iyadchebbah5@gmai.com → @gmail.com
//
// Read-modify-write; safe to re-run (idempotent).
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const dedupSort = (arr) => Array.from(new Set(arr)).sort();

// ── 1. Danar merge: pull editions from typo row, fold into canonical, add "13", delete typo
{
  const { data: canonical } = await sb
    .from("participants")
    .select("id, editions")
    .eq("email", "danar.kayfi@gmail.com")
    .maybeSingle();

  const { data: typo } = await sb
    .from("participants")
    .select("id, editions")
    .eq("email", "danar.kayfi@gmai.com")
    .maybeSingle();

  if (!canonical) {
    console.log("⚠  danar.kayfi@gmail.com not found — skipping merge.");
  } else {
    const fromTypo = typo?.editions ?? [];
    const merged = dedupSort([...(canonical.editions ?? []), ...fromTypo, "13"]);
    const { error: upErr } = await sb
      .from("participants")
      .update({ editions: merged })
      .eq("id", canonical.id);
    if (upErr) console.error("update danar canonical failed:", upErr);
    else console.log(`✓ danar.kayfi@gmail.com editions → ${JSON.stringify(merged)}`);

    if (typo) {
      const { error: delErr } = await sb.from("participants").delete().eq("id", typo.id);
      if (delErr) console.error("delete danar typo failed:", delErr);
      else console.log("✓ deleted danar.kayfi@gmai.com (orphan typo row)");
    } else {
      console.log("· danar.kayfi@gmai.com already removed");
    }
  }
}

// ── 2. Fix the other two solo @gmai.com rows by rewriting email → @gmail.com
const REWRITES = ["hanitsermohamed5@gmai.com", "iyadchebbah5@gmai.com"];

for (const oldEmail of REWRITES) {
  const newEmail = oldEmail.replace("@gmai.com", "@gmail.com");

  // Guard: don't clobber an existing canonical row (would violate UNIQUE email)
  const { data: existing } = await sb
    .from("participants")
    .select("id")
    .eq("email", newEmail)
    .maybeSingle();
  if (existing) {
    console.log(`⚠  ${newEmail} already exists — skipping rewrite of ${oldEmail}`);
    continue;
  }

  const { data: row } = await sb
    .from("participants")
    .select("id")
    .eq("email", oldEmail)
    .maybeSingle();
  if (!row) {
    console.log(`· ${oldEmail} not found (already fixed?)`);
    continue;
  }

  const { error: upErr } = await sb
    .from("participants")
    .update({ email: newEmail })
    .eq("id", row.id);
  if (upErr) console.error(`rewrite ${oldEmail} failed:`, upErr);
  else console.log(`✓ ${oldEmail} → ${newEmail}`);
}

console.log("\nDone.");
