# Game Zanga — Edition 14

[![live](https://img.shields.io/badge/live-gamezanga.net-b347ff)](https://www.gamezanga.net)
[![built with Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e)](https://supabase.com)

Custom website for **زنقة الألعاب / Game Zanga** — a 72-hour Arabic-language game jam. Replaces an expensive Wix setup with a self-hosted Next.js app on Vercel.

**Live**: <https://www.gamezanga.net> · **Apex** (`gamezanga.net`) 308-redirects to `www`.

The full product spec — pages, copy, rules, FAQ, design direction — lives in [CLAUDE.md](CLAUDE.md). Read that for the *why* and the *what*. This README is just the *how*.

---

## Stack

| Layer | Tool |
|---|---|
| Frontend + API routes | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS v4 (CSS-first theme in `app/globals.css`) |
| DB + Auth | Supabase (Postgres + magic-link OTP) |
| Email | Resend + `react-email` templates |
| Hosting | Vercel (free tier) |
| Language | TypeScript |

---

## First-time setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in real values — see CLAUDE.md → Environment Variables
```

### Supabase

1. Create a Supabase project at https://supabase.com.
2. **SQL Editor** → paste the schema from CLAUDE.md → *Database Schema* → Run.
3. **SQL Editor** → also run the votes-table override (see [CLAUDE.md → Database Schema](CLAUDE.md#database-schema-supabase)) — the votes table uses a `value` column with `-1 / 0 / +1`, *not* the original single-choice schema in the brief.
4. **Authentication → URL Configuration** → add `http://localhost:3000/auth/verify` (and your prod URL) to **Redirect URLs**.
5. **Authentication → Email Templates → Magic Link** → paste in the branded Arabic/English template (see CLAUDE.md → Email Branding).
6. *(Recommended)* **Project Settings → Auth → SMTP** → switch from the default sender to Resend so emails come from `hello@gamezanga.net`. Requires the domain be verified in Resend.

### Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Each-year update workflow

Most years, the only file you touch is **[`lib/jam-config.ts`](lib/jam-config.ts)**:

| What | Where |
|---|---|
| Edition number | `JAM_CONFIG.edition` |
| Jam start/end (KSA, UTC+3) | `jam_start`, `jam_end` |
| Registration / suggestion / voting windows | `registration_open`, `registration_close`, etc. |
| itch.io URL | `itchio_url` (note: slugs vary — `game-zanga-N` for 5–6, `gamezangaN` for 7+) |
| Announced theme (once decided) | `announced_theme_ar`, `announced_theme_en` |
| Move the just-finished edition into the archive | `PAST_EDITIONS` array (add `poster_url`, `itchio_url`, `theme_ar/en`) |

You'll also typically want to refresh the **partners + media partners** for the new edition in [`components/home/Partners.tsx`](components/home/Partners.tsx) — each entry is `{ src, alt, href? }`.

Then in Supabase, insert a row for the new edition:

```sql
INSERT INTO jam_phases (edition, current_phase)
VALUES (15, 'pre_registration')
ON CONFLICT (edition) DO NOTHING;
```

Optionally bump the column defaults so manual SQL queries pick up the right edition. Note `participants.editions` is a **`TEXT[]`** (one row per person, accumulating edition tags like `{"14","15","SE"}`), while `theme_suggestions` / `votes` keep a singular `INTEGER edition`:

```sql
ALTER TABLE participants      ALTER COLUMN editions SET DEFAULT ARRAY['15'];
ALTER TABLE theme_suggestions ALTER COLUMN edition  SET DEFAULT 15;
ALTER TABLE votes             ALTER COLUMN edition  SET DEFAULT 15;
```

---

## Site routes

| Path | What |
|---|---|
| `/` | Hero, countdown, judging criteria, partners |
| `/about` | History, past editions |
| `/rules` | Game submission rules, judging, FAQ |
| `/register` | Registration form |
| `/suggest` | Theme suggestion (requires registered + signed-in user) |
| `/vote` | +1 / 0 / −1 rating per theme (requires registered + signed-in user) |
| `/admin` | Admin panel (gated by `ADMIN_SECRET`) — registrations, suggestion approval, live results, set winner, broadcast email |
| `/auth/verify` | Magic-link landing |

---

## Admin operations

The admin panel at `/admin` is gated by a single env var (`ADMIN_SECRET`). Paste the secret into the login screen — `POST /api/admin/login` exchanges it for an **HTTP-only, HMAC-signed `gz_admin` session cookie** (8h). JS can't read the cookie, so it's not XSS-exfiltratable. All `/api/admin/*` routes verify the cookie via `isAdminAuthorized()`.

Five panels:

1. **Registrations** — paginated table (25/page) with an edition filter, a "multi-edition only" toggle, and CSV export of the whole filtered set.
2. **Suggestions** — paginated (10/page) with status filter chips showing live counts (All / Pending / Approved / Rejected), opening on **Approved**. Approve, reject, or reset a theme to pending.
3. **Live Results** — per-theme net score, +1/0/−1 breakdown, voter count, sorted by score. **Hidden from voters** — `/api/themes` (the public endpoint) only exposes scores after the theme is announced.
4. **Set Winner** — manual entry; or click "Set as winner" on a row in the Live Results table.
5. **Broadcast Email** — bilingual email to participants, targetable by edition (`all`, a specific edition, or a set).

---

## Deployment

The site is deployed on **Vercel**, connected to the `Game-Zanga/gamezanga-website` GitHub repo. Every push to `main` triggers an auto-deploy in ~60 seconds.

### Production env vars (Vercel → Settings → Environment Variables)

Same keys as `.env.example`, with these production-specific values:

| Key | Production value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.gamezanga.net` |
| `ADMIN_SECRET` | *(a fresh value, **not** the dev one — generate with `openssl rand -hex 32` and store in a password manager)* |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | from the Cloudflare Turnstile widget |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | injected by the Vercel → Upstash integration |
| `CRON_SECRET` | set here **and** as a GitHub Actions repo secret (same value) |
| `DISCORD_SPAM_WEBHOOK` | Discord webhook the 3-hourly spam report posts to |
| `MAINTENANCE_MODE` | leave unset; set to `true` only to hard-close registration |
| Everything else | same as `.env.local` |

After changing any env var, you have to **manually redeploy** (Deployments → ⋯ on latest → Redeploy) — env changes don't apply retroactively.

> **Security & anti-spam**: registration is protected by CSRF origin checks, Upstash rate limiting, Cloudflare Turnstile, and a static+dynamic spam blocklist (with a 3-hourly Discord report + auto-blocklist cron). See **CLAUDE.md → Security** for the full picture.

### Domain (`gamezanga.net`)

- Apex `gamezanga.net` and `www.gamezanga.net` are both added in Vercel → Domains.
- DNS is hosted at the registrar with an `A` record for the apex and a `CNAME` for `www`, pointing at Vercel.
- Apex 308-redirects to `www`, so `https://www.gamezanga.net` is canonical.
- SSL is auto-provisioned by Vercel via Let's Encrypt.

### Supabase auth — production redirect

**Supabase → Authentication → URL Configuration** must include `https://www.gamezanga.net/auth/verify` in **Redirect URLs**, and the **Site URL** must be `https://www.gamezanga.net`. Otherwise magic-link sign-ins on production will bounce.

### Email — Resend

`gamezanga.net` is verified in Resend (SPF + DKIM TXT records live alongside the Vercel DNS records). Registration confirmations send from `hello@gamezanga.net`.

Supabase's auth emails (the Magic Link template) are routed through Resend SMTP — configured in Supabase → Project Settings → Auth → SMTP — so they also send from `hello@gamezanga.net`.

---

## Local commands

```bash
npm run dev      # dev server with Turbopack
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

---

## Where things live

```
app/             Pages + API routes (App Router)
components/      Layout, forms, UI primitives
emails/          React-Email templates
lib/             jam-config, phase-utils, i18n, validation, security helpers, supabase clients
scripts/         One-off maintenance (imports, spam cleanup, stats) — run with node --env-file
docs/            Standalone deliverables, not part of the build (see below)
public/images/   Local assets — editions/ (past-jam posters), partners/ (logos)
```

See CLAUDE.md → Folder Structure for the full tree.

---

## Standalone deliverables (`docs/`)

Self-contained HTML — open directly in a browser, no build step. Fonts and logos are inlined as
data URIs so they work offline and render Arabic correctly.

| File | What |
|---|---|
| `social-post-generator.html` | Canvas tool — branded social posts at any size, plus circle-safe profile icons. Exports PNG. |
| `media-kit.html` | Bilingual partner/sponsor profile — audience numbers, demographics, collaboration options. |
| `Game-Zanga-Media-Kit-2026.pdf` | A4 PDF rendered from the above (Puppeteer, print stylesheet). |
| `Game-Zanga-Media-Kit-2026.docx` | Editable version for Google Docs / Word — built by `scripts/build-media-kit-docx.mjs`. |
| `results-gz14/` | Embargoed edition-14 standings + the generated top-10 winner cards. |
| `itchio-page.html` | RTL Arabic fragment to paste into the itch.io jam description. |

Media-kit figures come from `scripts/media-kit-stats.mjs` and are **hand-updated** — re-run it and
edit the numbers before sending. See CLAUDE.md → Standalone deliverables for the gotchas.
