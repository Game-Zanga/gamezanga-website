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

Optionally bump the column defaults so manual SQL queries pick up the right edition:

```sql
ALTER TABLE participants      ALTER COLUMN edition SET DEFAULT 15;
ALTER TABLE theme_suggestions ALTER COLUMN edition SET DEFAULT 15;
ALTER TABLE votes             ALTER COLUMN edition SET DEFAULT 15;
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

The admin panel at `/admin` is gated by a single env var (`ADMIN_SECRET`). Paste the secret into the login screen — it's stored in `sessionStorage` and sent as `x-admin-secret` on every `/api/admin/*` call.

Four panels:

1. **Registrations** — table of all participants, export to CSV.
2. **Suggestions** — approve / reject / un-approve submitted themes.
3. **Live Results** — per-theme net score, +1/0/−1 breakdown, voter count, sorted by score. **Hidden from voters** — `/api/themes` (the public endpoint) only exposes scores after the theme is announced.
4. **Set Winner** — manual entry; or click "Set as winner" on a row in the Live Results table.
5. **Broadcast Email** — sends a bilingual email to all registered participants this edition.

---

## Deployment

The site is deployed on **Vercel**, connected to the `Game-Zanga/gamezanga-website` GitHub repo. Every push to `main` triggers an auto-deploy in ~60 seconds.

### Production env vars (Vercel → Settings → Environment Variables)

Same keys as `.env.example`, with these production-specific values:

| Key | Production value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.gamezanga.net` |
| `ADMIN_SECRET` | *(a fresh value, **not** the dev one — generate with `openssl rand -hex 32` and store in a password manager)* |
| Everything else | same as `.env.local` |

After changing any env var, you have to **manually redeploy** (Deployments → ⋯ on latest → Redeploy) — env changes don't apply retroactively.

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
lib/             jam-config, phase-utils, i18n, validation, supabase clients, etc.
public/images/   Logos, partner logos, posters
```

See CLAUDE.md → Folder Structure for the full tree.
