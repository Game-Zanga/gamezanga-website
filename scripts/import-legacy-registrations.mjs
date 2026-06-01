#!/usr/bin/env node
/**
 * One-shot importer for legacy Game Zanga registrations.
 *
 * Reads a CSV from scripts/legacy-data/editionN.csv (Google Form export format),
 * upserts each row into participants:
 *   - first encounter for an email  → INSERT with profile + editions=[TAG]
 *   - email already exists in DB    → APPEND TAG to the editions array (deduped).
 *                                      Profile fields are NOT overwritten — preserves
 *                                      whichever data was inserted first.
 *
 * Edition tag is a string (since participants.editions is TEXT[]). Use the edition
 * number for numbered editions ("13", "12", …) and "SE" for the Special Edition.
 *
 * RECOMMENDED IMPORT ORDER (newest first, so newest profile data wins):
 *   1. node --env-file=.env.local scripts/import-legacy-registrations.mjs 13 scripts/legacy-data/edition13.csv
 *   2. node --env-file=.env.local scripts/import-legacy-registrations.mjs SE scripts/legacy-data/editionSE.csv
 *   3. node --env-file=.env.local scripts/import-legacy-registrations.mjs 12 scripts/legacy-data/edition12.csv
 *
 * Requires Node 20.6+ (for --env-file). Pre-flight: run the editions[] SQL migration
 * before this script — it expects the new `editions TEXT[]` column to exist.
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// CLI args
// ─────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const positional = args.filter((a) => !a.startsWith("--"));
const [editionArg, csvPath] = positional;
const edition = (editionArg ?? "").trim();

if (!edition || !csvPath) {
  console.error("Usage: node --env-file=.env.local scripts/import-legacy-registrations.mjs <edition-tag> <csv-path> [--dry-run]");
  console.error("  <edition-tag>  string: \"13\", \"12\", \"SE\", etc.");
  console.error("  <csv-path>     path to the Google Form CSV export");
  console.error("  --dry-run      parse + look up against the DB but make NO writes");
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  console.error("Run with: node --env-file=.env.local scripts/import-legacy-registrations.mjs ...");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─────────────────────────────────────────────────────────────────────────────
// Minimal CSV parser — handles RFC 4180 quoting (commas inside "…", "" escapes)
// ─────────────────────────────────────────────────────────────────────────────

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { rows.push(row); row = []; };

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { pushField(); i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { pushField(); pushRow(); i++; continue; }
    field += c; i++;
  }
  // flush last field/row
  if (field.length > 0 || row.length > 0) { pushField(); pushRow(); }
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// Field mappers
// CSV values are typically bilingual: "Arabic ... English" — match on either.
// ─────────────────────────────────────────────────────────────────────────────

function normalize(v) {
  return (v ?? "").toString().trim();
}

// Common email-domain typos seen in Google Form submissions. Applied before the
// DB lookup so a CSV row with "@gmai.com" merges into the canonical "@gmail.com"
// participant instead of creating an orphan duplicate.
const EMAIL_DOMAIN_FIXES = {
  "gmai.com":    "gmail.com",
  "gmial.com":   "gmail.com",
  "gnail.com":   "gmail.com",
  "gmaill.com":  "gmail.com",
  "gmali.com":   "gmail.com",
  "gmsil.com":   "gmail.com",
  "yaho.com":    "yahoo.com",
  "yahooo.com":  "yahoo.com",
  "yhaoo.com":   "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com":  "hotmail.com",
  "hormail.com": "hotmail.com",
  "outloo.com":  "outlook.com",
  "outlokk.com": "outlook.com",
};

function normalizeEmail(raw) {
  const lower = (raw ?? "").toString().trim().toLowerCase();
  if (!lower.includes("@")) return lower;
  const at = lower.lastIndexOf("@");
  const local = lower.slice(0, at);
  const domain = lower.slice(at + 1);
  const fixed = EMAIL_DOMAIN_FIXES[domain];
  return fixed ? `${local}@${fixed}` : lower;
}

function parseGender(v) {
  const s = normalize(v);
  // Check female FIRST — "Female" contains the substring "male", so naïve
  // /male/i would falsely match it. Short-circuiting on female is the simple fix.
  if (/أنثى|female/i.test(s)) return "female";
  if (/ذكر|male/i.test(s)) return "male";
  return null; // "Prefer not to answer" or empty
}

function parseAgeGroup(v) {
  const s = normalize(v);
  if (/أقل من ١٨|under\s*18/i.test(s)) return "under_18";
  if (/١٨\s*-\s*٢٢|18\s*-\s*22/.test(s)) return "18_22";
  if (/٢٣\s*-\s*٢٩|23\s*-\s*29/.test(s)) return "23_29";
  if (/٣٠\s*-\s*٣٩|30\s*-\s*39/.test(s)) return "30_39";
  if (/أكثر من ٤٠|over\s*40/i.test(s)) return "over_40";
  return null;
}

// Canonical country list from lib/i18n.ts. Match on the English value.
const COUNTRY_VALUES = [
  "Jordan", "UAE", "Bahrain", "Algeria", "KSA", "Sudan", "Somalia",
  "Iraq", "Kuwait", "Morocco", "Yemen", "Tunisia", "Djibouti", "Syria",
  "Oman", "Palestine", "Qatar", "Lebanon", "Libya", "Egypt", "Mauritania",
];
// CSVs occasionally use "Saudi Arabia" instead of "KSA"
const COUNTRY_ALIASES = { "Saudi Arabia": "KSA" };

function parseCountry(v) {
  const s = normalize(v);
  if (!s) return { country: "Other", country_other: "" };

  // Bilingual "Arabic ... English" — pull the English half if present.
  const enPart = s.includes("...") ? s.split("...").pop().trim() : s;
  const canonical = COUNTRY_ALIASES[enPart] ?? enPart;

  if (COUNTRY_VALUES.includes(canonical)) {
    return { country: canonical, country_other: null };
  }
  // Free-text country (Canada, "From Saudi Arabia but based in the United Kingdom", etc.)
  return { country: "Other", country_other: s };
}

const SKILL_MAP = [
  { key: "programming", re: /البرمجة|programming/i },
  { key: "art",         re: /الرسم|^art\b|\bart$|game art/i },
  { key: "design",      re: /تصميم|game design/i },
  { key: "audio",       re: /المؤثرات الصوتية|sound\s*fx|audio|music/i },
];

function parseSkills(v) {
  const s = normalize(v);
  if (!s) return { skills: [], skills_other: null };

  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  const matched = new Set();
  const unmatched = [];
  for (const p of parts) {
    const hit = SKILL_MAP.find((m) => m.re.test(p));
    if (hit) matched.add(hit.key);
    else unmatched.push(p);
  }
  const skills = [...matched];
  let skills_other = null;
  if (unmatched.length > 0) {
    skills.push("other");
    skills_other = unmatched.join(", ");
  }
  return { skills, skills_other };
}

function parseParticipated(v) {
  const s = normalize(v);
  if (/نعم|yes/i.test(s)) return true;
  if (/لا|^no$/i.test(s)) return false;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Header lookup (Arabic-only or bilingual — match by prefix)
// ─────────────────────────────────────────────────────────────────────────────

function findCol(headers, ...arabicTokens) {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim();
    if (arabicTokens.some((t) => h.startsWith(t) || h.includes(t))) return i;
  }
  return -1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

const csvText = readFileSync(csvPath, "utf8");
const rows = parseCsv(csvText);
if (rows.length < 2) {
  console.error("CSV has no data rows.");
  process.exit(1);
}

const headers = rows[0].map((h) => h.trim());
const col = {
  name:    findCol(headers, "الإسم الكامل"),
  email:   findCol(headers, "البريد الإلكتروني"),
  mobile:  findCol(headers, "رقم الموبايل"),
  gender:  findCol(headers, "الجنس"),
  age:     findCol(headers, "الفئة العمرية"),
  country: findCol(headers, "البلد"),
  skills:  findCol(headers, "تبدع في"),
  before:  findCol(headers, "هل شاركت"),
};

const missing = Object.entries(col).filter(([, v]) => v === -1).map(([k]) => k);
if (missing.length) {
  console.error(`Could not find columns in CSV header: ${missing.join(", ")}`);
  console.error(`Headers found: ${JSON.stringify(headers)}`);
  process.exit(1);
}

const dataRows = rows.slice(1).filter((r) => r.some((cell) => cell.trim().length > 0));
const mode = dryRun ? "DRY-RUN (no writes)" : "WRITING";
console.log(`[${mode}] Processing ${dataRows.length} rows from ${csvPath} as edition "${edition}"…\n`);

let inserted = 0;
let appended = 0;
let alreadyTagged = 0;
let skipped = 0;
let emailsFixed = 0;
const skipReasons = [];
const emailFixesSample = [];

for (let idx = 0; idx < dataRows.length; idx++) {
  const r = dataRows[idx];
  const lineNum = idx + 2; // 1-based + header row

  const full_name = normalize(r[col.name]);
  const rawEmail = normalize(r[col.email]).toLowerCase();
  const email = normalizeEmail(rawEmail);
  if (rawEmail !== email) {
    emailsFixed++;
    if (emailFixesSample.length < 10) emailFixesSample.push({ from: rawEmail, to: email });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    skipped++;
    skipReasons.push({ line: lineNum, email: email || "(empty)", reason: "invalid_email" });
    continue;
  }
  if (full_name.length < 2) {
    skipped++;
    skipReasons.push({ line: lineNum, email, reason: "missing_name" });
    continue;
  }

  const age_group = parseAgeGroup(r[col.age]);
  if (!age_group) {
    skipped++;
    skipReasons.push({ line: lineNum, email, reason: `bad_age_group:"${r[col.age]}"` });
    continue;
  }

  const { country, country_other } = parseCountry(r[col.country]);
  const { skills, skills_other } = parseSkills(r[col.skills]);
  if (skills.length === 0) {
    skipped++;
    skipReasons.push({ line: lineNum, email, reason: `no_skills:"${r[col.skills]}"` });
    continue;
  }

  const participated_before = parseParticipated(r[col.before]);
  if (participated_before === null) {
    skipped++;
    skipReasons.push({ line: lineNum, email, reason: `bad_participated:"${r[col.before]}"` });
    continue;
  }

  const profile = {
    full_name,
    mobile: normalize(r[col.mobile]) || null,
    gender: parseGender(r[col.gender]),
    age_group,
    country,
    country_other,
    skills,
    skills_other,
    participated_before,
  };

  // Look up by email
  const { data: existing, error: lookupErr } = await supabase
    .from("participants")
    .select("id, editions")
    .eq("email", email)
    .maybeSingle();

  if (lookupErr) {
    skipped++;
    skipReasons.push({ line: lineNum, email, reason: `lookup_failed:${lookupErr.message}` });
    continue;
  }

  if (existing) {
    const current = existing.editions ?? [];
    if (current.includes(edition)) {
      alreadyTagged++;
      continue;
    }
    if (!dryRun) {
      const next = [...current, edition].sort();
      const { error: updateErr } = await supabase
        .from("participants")
        .update({ editions: next })
        .eq("id", existing.id);
      if (updateErr) {
        skipped++;
        skipReasons.push({ line: lineNum, email, reason: `update_failed:${updateErr.message}` });
        continue;
      }
    }
    appended++;
  } else {
    if (!dryRun) {
      const { error: insertErr } = await supabase
        .from("participants")
        .insert({ ...profile, email, editions: [edition] });
      if (insertErr) {
        skipped++;
        skipReasons.push({ line: lineNum, email, reason: `insert_failed:${insertErr.message}` });
        continue;
      }
    }
    inserted++;
  }

  // Progress dot every 50 rows so it doesn't look frozen on 2k-row files.
  if ((idx + 1) % 50 === 0) {
    process.stdout.write(`  ${idx + 1}/${dataRows.length}\r`);
  }
}

console.log("\n──────────────── Summary ────────────────");
console.log(`  Mode:                             ${mode}`);
console.log(`  ${dryRun ? "Would insert new rows:           " : "Inserted new rows:               "} ${inserted}`);
console.log(`  ${dryRun ? "Would append to existing:        " : "Appended edition to existing:    "} ${appended}`);
console.log(`  Already had edition "${edition}" (no-op):  ${alreadyTagged}`);
console.log(`  Skipped (validation/db error):    ${skipped}`);
console.log(`  Emails auto-corrected (typo fix): ${emailsFixed}`);
console.log(`  Total processed:                  ${dataRows.length}`);

if (emailFixesSample.length > 0) {
  console.log("\n──────────────── Sample email fixes ────────────────");
  for (const f of emailFixesSample) console.log(`  ${f.from}  →  ${f.to}`);
  if (emailsFixed > emailFixesSample.length) {
    console.log(`  … and ${emailsFixed - emailFixesSample.length} more`);
  }
}

if (skipReasons.length > 0) {
  console.log("\n──────────────── Skipped rows (first 30) ────────────────");
  for (const s of skipReasons.slice(0, 30)) {
    console.log(`  line ${s.line}  ${s.email}  →  ${s.reason}`);
  }
  if (skipReasons.length > 30) {
    console.log(`  … and ${skipReasons.length - 30} more`);
  }
}
