// Diagnostic: find @gmai.com typo orphans and their @gmail.com counterparts.
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TYPO_DOMAINS = {
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmali.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
};

console.log("Typo-email orphans and their canonical-email counterparts:\n");

for (const [typo, canonical] of Object.entries(TYPO_DOMAINS)) {
  // Find rows with typo'd domain
  const { data: typoRows } = await sb
    .from("participants")
    .select("id, email, full_name, editions")
    .ilike("email", `%@${typo}`);

  if (!typoRows || typoRows.length === 0) continue;

  for (const t of typoRows) {
    const localPart = t.email.split("@")[0];
    const canonicalEmail = `${localPart}@${canonical}`;

    const { data: match } = await sb
      .from("participants")
      .select("id, email, full_name, editions")
      .eq("email", canonicalEmail)
      .maybeSingle();

    console.log(`Typo row:     ${t.email.padEnd(40)} ${t.full_name.padEnd(25)} ${JSON.stringify(t.editions)}`);
    if (match) {
      console.log(`Canonical:    ${match.email.padEnd(40)} ${match.full_name.padEnd(25)} ${JSON.stringify(match.editions)}`);
      const merged = Array.from(new Set([...(match.editions ?? []), ...(t.editions ?? [])])).sort();
      console.log(`→ would merge editions: ${JSON.stringify(merged)} into ${canonicalEmail}, delete typo row`);
    } else {
      console.log(`Canonical:    NOT IN DB — typo row may be safe to fix in place (UPDATE email)`);
    }
    console.log();
  }
}
