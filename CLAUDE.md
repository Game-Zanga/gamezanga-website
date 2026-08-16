# Game Zanga Website — Claude Code Project Brief

> This file is the single source of truth for this project.
> Read it fully before writing any code or making any decisions.

> **Status**: Live in production at **<https://www.gamezanga.net>** (apex `gamezanga.net` 308-redirects to `www`). Deployed on Vercel from the `Game-Zanga/gamezanga-website` GitHub repo — every push to `main` auto-deploys.

---

## What Is Game Zanga?

Game Zanga (زنقة الألعاب) is a well-known Arabic-language game jam — a 72-hour online event where Arab game developers and enthusiasts build games around a surprise theme. It is held once a year, typically on a Thursday–Sunday weekend in summer. This is **edition 14** (Thu 13 Aug – Sun 16 Aug 2026, KSA — postponed from the original 2–5 Jul window). The community spans the entire Arab world and participates remotely via Discord and itch.io.

---

## Project Goal

Replace an expensive Wix website with a custom-built Next.js site hosted on Vercel. The new site must be:
- Fully bilingual: **Arabic (primary, RTL)** and **English (secondary, LTR)**
- Visually striking — dark, gaming aesthetic befitting a game jam
- Fully self-contained: registration, theme suggestions, and voting all happen on this site
- Connected to Supabase (database + auth) and Resend (emails)
- Easy to update each year by editing a single config file

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend + API routes | Next.js 16 (App Router, Turbopack) |
| Hosting | Vercel (free tier) |
| Database + Auth | Supabase (free tier) |
| Email | Resend + `react-email` templates |
| Styling | Tailwind CSS v4 (CSS-first theme in `app/globals.css`) |
| Language | TypeScript |

---

## Environment Variables

Create a `.env.local` file in the project root with these values (`.env.example` has the same keys as placeholders).

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Resend (transactional email)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=hello@gamezanga.net

# Admin panel — long random secret; generate with `openssl rand -hex 32`.
# The /admin login exchanges it for an HTTP-only signed session cookie.
ADMIN_SECRET=replace-with-long-random-string

# Public site URL. Used for magic-link redirects AND the CSRF same-origin check.
# Dev:  http://localhost:3000   Prod: https://www.gamezanga.net
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cloudflare Turnstile (CAPTCHA on /register). Site key public; secret server-only.
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...

# Upstash Redis (rate limiting + dynamic spam blocklist). The Vercel Upstash
# integration injects KV_REST_API_*; the standalone dashboard uses
# UPSTASH_REDIS_REST_*. The code accepts EITHER naming (see lib/ratelimit.ts).
KV_REST_API_URL=https://xxxx.upstash.io
KV_REST_API_TOKEN=your-upstash-token

# Emergency kill switch — set to exactly "true" to make /api/register return 503.
MAINTENANCE_MODE=false

# Spam-report cron (GitHub Actions → /api/cron/spam-report) + Discord webhook.
CRON_SECRET=replace-with-long-random-string
DISCORD_SPAM_WEBHOOK=https://discord.com/api/webhooks/xxx/yyy
```

**Never commit `.env.local` to git.** Use a *different* `ADMIN_SECRET` in production than in dev — generate a fresh one with `openssl rand -hex 32` and set it in Vercel's env vars, *not* in this file.

**Fail-open behaviour**: Turnstile, rate limiting, and the dynamic blocklist all **allow requests when their env vars are missing** (so local dev without those keys still works). In production, all keys must be set or those protections silently no-op. `MAINTENANCE_MODE` and the spam-report cron are optional.

---

## Jam Configuration File

[`lib/jam-config.ts`](lib/jam-config.ts) is the only file that needs editing each year. Current contents (edition 14):

```ts
export const JAM_CONFIG = {
  edition: 14,
  name_ar: "زنقة الألعاب",
  name_en: "Game Zanga",
  tagline_ar: "فعالية تطوير الألعاب العربية",
  tagline_en: "Arab Game Development Event",

  // Jam dates (Saudi time = UTC+3) — postponed from the original July window.
  jam_start: "2026-08-13T20:00:00+03:00", // Thursday 8pm
  jam_end:   "2026-08-16T22:00:00+03:00", // Sunday 10pm

  // Phase dates
  registration_open:  "2026-05-25T00:00:00+03:00",
  registration_close: "2026-08-16T22:00:00+03:00", // open through the jam itself
  suggestion_open:    "2026-05-27T00:00:00+03:00",
  suggestion_close:   "2026-07-22T00:00:00+03:00",
  voting_open:        "2026-07-30T00:00:00+03:00",
  voting_close:       "2026-08-12T00:00:00+03:00",
  theme_announced:    "2026-08-13T20:00:00+03:00", // = jam_start

  // itch.io play-and-rate window: opens at jam_end, must match the jam's
  // "Voting end date" on itch.io. Drives the home page's rating block.
  rating_close:       "2026-08-23T00:00:00+03:00",

  // Links
  itchio_url:    "https://itch.io/jam/gamezanga14",
  discord_url:   "https://discord.gg/xvxEPtrzgu",

  // Social
  twitter_url:   "https://twitter.com/GameZanga",
  youtube_url:   "https://www.youtube.com/@gamezanga",
  linkedin_url:  "https://www.linkedin.com/company/gamezanga",
  instagram_url: "https://www.instagram.com/gamezanga/",
  facebook_url:  "https://www.facebook.com/GameZanga",

  // The announced theme. Leave "" until the admin presses "Set as winner"
  // (which also updates the jam_phases row in the DB).
  announced_theme_ar: "",
  announced_theme_en: "",

  // Max theme suggestions per participant
  max_suggestions_per_user: 3,

  // How many themes the admin should approve for the voting round (informational)
  themes_in_voting: 10,
} as const;
```

The site's current phase is computed from these dates at runtime by [`lib/phase-utils.ts`](lib/phase-utils.ts) — there is no scheduled job. The `jam_phases` table in Supabase stores the announced theme only; phase tracking is date-driven.

---

## Site Pages & Routes

### `/` — Home
- Hero section: Logo + edition number + animated countdown timer to jam start
- Current jam dates and times (with Saudi timezone label)
- Three-step registration CTA (visual steps)
- About the jam (short paragraph)
- Judging criteria section
- Partners / sponsors logo grid
- Media partners logo grid
- Footer with all social links

### `/about` — About
- Full history and description of Game Zanga
- What is a game jam?
- Who can participate?
- Past editions archive (links to their itch.io pages)

### `/rules` — Rules & FAQ
- Game submission rules
- General jam rules
- FAQ accordion (all questions from the current site, translated where needed)

### `/register` — Registration
- Registration form (see fields below)
- Shows "Registration closed" if outside registration window
- On submit: saves to Supabase, sends confirmation email via Resend, redirects to success page

### `/suggest` — Theme Suggestions
- Only accessible to registered + logged-in participants
- Shows current suggestions list (without vote counts at this stage)
- Form to submit up to 3 theme suggestions (Arabic or English)
- Shows "Suggestions closed" outside the suggestion window

### `/vote` — Theme Voting
- Only accessible to registered + logged-in participants
- Shows the curated list of approved themes
- **Each participant rates *every* theme as +1 (نعم / Yes), 0 (محايد / Neutral), or −1 (لا / No)** — not a single-choice vote. Ratings can be changed any time during the voting window (server `upsert` on `(participant_id, theme_id, edition)`).
- **Vote tallies are hidden from voters** to prevent bandwagon effects. `/api/themes` returns `score: 0` for every theme until the winning theme is announced. Admins see live tallies via `/api/admin/results`.
- Shows "Voting closed" outside the voting window.
- Shows winning theme if announced (via the `WinningTheme` component).

### `/admin` — Admin Panel (password protected)
- View all registrations — server-paginated table (25/page), edition filter, "multi-edition only"
  toggle, CSV export of the whole filtered set
- **Theme suggestions** — server-paginated (10/page) with status filter chips
  (الكل / قيد المراجعة / معتمد / مرفوض) showing live counts. **The panel opens on معتمد
  (approved)** — the themes actually picked for the voting round — not on الكل. Each card
  carries a coloured status
  pill and approve / reject / reset-to-pending buttons; the button matching the current state is
  disabled. Switching filters clears rows first, and a monotonic request counter discards
  out-of-order responses so fast switching can't leave stale cards on screen.
- **Live Results** panel — per-theme net score, +1 / 0 / −1 breakdown, voter count, sorted by score. Admin-only — *not* exposed in the public `/api/themes` response.
- Set the winning theme — manual input or one-click "Set as winner" on any row in Live Results
- Send broadcast email to all registered participants (Resend, bilingual)

### `/auth/verify` — Magic Link Landing
- Handles Supabase magic link email verification
- Redirects user to the page they were trying to reach

---

## Database Schema (Supabase)

Run these SQL statements in the Supabase SQL editor to set up the database:

```sql
-- Participants table (fields match the real Game Zanga registration form exactly)
CREATE TABLE participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  full_name TEXT NOT NULL,               -- الإسم الكامل (two parts required)
  email TEXT UNIQUE NOT NULL,            -- البريد الإلكتروني
  mobile TEXT,                           -- رقم الموبايل (optional)
  gender TEXT CHECK (gender IN ('male', 'female')),  -- الجنس (optional)
  age_group TEXT NOT NULL CHECK (age_group IN ('under_18', '18_22', '23_29', '30_39', 'over_40')),
  country TEXT NOT NULL,                 -- البلد
  country_other TEXT,                    -- free text if "Other" selected
  skills TEXT[] NOT NULL,                -- تبدع في (multi-select array)
  skills_other TEXT,                     -- free text if "Other" selected in skills
  participated_before BOOLEAN NOT NULL,  -- هل شاركت من قبل؟
  -- ONE ROW PER EMAIL GLOBALLY (email is UNIQUE). `editions` is a TEXT[] that
  -- accumulates every edition the person registered for, e.g. {"12","13","14","SE"}.
  -- "SE" = the non-numbered Special Edition. Query with `editions @> ARRAY['14']`.
  editions TEXT[] NOT NULL DEFAULT ARRAY['14']
);
CREATE INDEX participants_editions_idx ON participants USING GIN (editions);

-- NOTE: theme_suggestions / votes / jam_phases keep a SINGULAR `edition INTEGER`
-- column — those rows are inherently tied to one jam. Only `participants` uses
-- the TEXT[] `editions` array (a person spans multiple editions; a vote does not).

-- Theme suggestions table
CREATE TABLE theme_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  theme_ar TEXT NOT NULL,
  theme_en TEXT,
  approved BOOLEAN DEFAULT NULL, -- NULL=pending, TRUE=approved for voting, FALSE=rejected
  edition INTEGER NOT NULL DEFAULT 14
);

-- Votes table — each participant rates every theme +1 / 0 / -1.
-- One row per (participant, theme, edition); upserted on rating change.
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES theme_suggestions(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 0, 1)),
  edition INTEGER NOT NULL DEFAULT 14,
  UNIQUE(participant_id, theme_id, edition)
);

-- Jam phase / winning theme storage
CREATE TABLE jam_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  edition INTEGER UNIQUE NOT NULL,
  current_phase TEXT NOT NULL DEFAULT 'pre_registration',
  -- phases: pre_registration, registration, suggestion, voting, announced, jam_active, jam_ended
  -- (Phase tracking is actually date-driven in lib/phase-utils.ts. This column is currently unused.)
  winning_theme_ar TEXT,
  winning_theme_en TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert current edition
INSERT INTO jam_phases (edition, current_phase) VALUES (14, 'pre_registration');

-- Row Level Security. RLS is enabled on ALL tables; API routes use the service
-- role (which bypasses RLS). A table with RLS on but no policy is default-deny
-- for the anon/authenticated roles — that's how jam_phases is locked down.
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jam_phases ENABLE ROW LEVEL SECURITY; -- no policy = anon can't read winner pre-reveal

-- Policies: participants can read their own data, API routes use service role
CREATE POLICY "participants can view own data"
  ON participants FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "theme suggestions are public during voting"
  ON theme_suggestions FOR SELECT
  USING (approved = TRUE);

CREATE POLICY "participants can view own suggestions"
  ON theme_suggestions FOR SELECT
  USING (participant_id IN (
    SELECT id FROM participants WHERE email = auth.jwt() ->> 'email'
  ));
```

---

## Registration Form Fields

Taken directly from the real Google Form used in edition 13. Replicate these exactly.

```
الإسم الكامل / Full Name        [required] [text]
  - Must be real name, two parts (first name + family name)
  - Label note: يجب ادخال الاسم الحقيقي من مقطعين

البريد الإلكتروني / Email        [required] [email, GLOBALLY unique — one row per person]
  - Label note: هو الوسيلة الرئيسية للتواصل
  - Re-registering with an existing email appends the current edition tag to
    that row's `editions[]` array; it does NOT create a second row.

رقم الموبايل / Mobile Number     [optional] [text]

الجنس / Gender                   [optional] [radio]
  - ذكر / Male
  - أنثى / Female

الفئة العمرية / Age Group        [required] [radio]
  - أقل من ١٨ / Under 18
  - ١٨-٢٢
  - ٢٣-٢٩
  - ٣٠-٣٩
  - أكثر من ٤٠ / Over 40

البلد / Country                  [required] [dropdown]
  - الأردن / Jordan
  - الإمارات / UAE
  - البحرين / Bahrain
  - الجزائر / Algeria
  - السعودية / KSA
  - السودان / Sudan
  - الصومال / Somalia
  - العراق / Iraq
  - الكويت / Kuwait
  - المغرب / Morocco
  - اليمن / Yemen
  - تونس / Tunisia
  - جيبوتي / Djibouti
  - سوريا / Syria
  - عُمان / Oman
  - فلسطين / Palestine
  - قطر / Qatar
  - لبنان / Lebanon
  - ليبيا / Libya
  - مصر / Egypt
  - موريتانيا / Mauritania
  - Other (free text)

تبدع في / Skilled in             [required] [multi-select checkboxes]
  - البرمجة / Programming
  - الرسم / Art
  - تصميم / Game Design
  - المؤثرات الصوتية / Sound FX
  - Other (free text)

هل شاركت في زنقة الالعاب من قبل؟ / Participated before?  [required] [radio]
  - نعم / Yes
  - لا / No
```

---

## API Routes

All routes live under `app/api/`. Errors from user-facing routes use the shape `{ code: "err_xxx" }` (or `{ errors: [{ field, code }] }` for field-level validation); the client translates the code with `trCode()` from `lib/i18n.ts`.

See the **Security** section below for the shared middleware helpers (`isSameOrigin`, `checkRateLimit`, `verifyTurnstile`, `checkSpamSignature`) that guard the mutating routes.

### `POST /api/register`
Runs a defense-in-depth gauntlet **in this order** before touching the DB:
1. `MAINTENANCE_MODE === "true"` → 503 `err_maintenance` (instant kill switch)
2. `isSameOrigin(req)` → 403 `err_bad_origin` (CSRF)
3. `checkRateLimit` bucket `register` (10 / 10 min per IP) → 429 `err_rate_limited`
4. `verifyTurnstile` → 403 `err_captcha_failed`
5. `validateRegister` field validation → 400 `{ errors }`
6. `checkSpamSignature` → **fake `{ success: true }`** (shadowban — no DB write, bot thinks it worked)

Then the actual write (**upsert by email**, not insert):
- If the email is new → inserts a `participants` row with `editions: ["14"]`.
- If the email already exists **and isn't tagged with the current edition** → appends `"14"` to `editions[]`. **Profile fields are NOT overwritten** (blocks identity hijacking — see Security). Already-tagged → 409 `err_email_already_registered`.
- **Pre-creates / tolerates a Supabase auth user** via `supabase.auth.admin.createUser()` so future sign-ins hit the branded Magic Link template (returning users already have one — "already exists" is ignored).
- Sends confirmation email via Resend (best-effort; skipped if `RESEND_API_KEY` unset).
- Returns `{ success: true, id: uuid }`.

### `POST /api/suggest`
- `isSameOrigin` (CSRF) + `checkRateLimit` bucket `suggest` (20 / 10 min) up front.
- Requires authenticated user (Supabase session)
- Checks suggestion window is open
- Confirms the user is a registered participant for the current edition via
  `.contains("editions", ["14"])` (array containment, since `editions` is TEXT[])
- Checks they haven't exceeded `max_suggestions_per_user`
- Inserts into `theme_suggestions`
- Returns `{ success: true }`

### `POST /api/vote`
- `isSameOrigin` (CSRF) + `checkRateLimit` bucket `vote` (60 / min) up front.
- Requires authenticated user (Supabase session)
- Checks voting window is open
- Body: `{ theme_id: uuid, value: -1 | 0 | 1 }`
- Participant looked up via `.contains("editions", ["14"])`
- **Upserts** by `(participant_id, theme_id, edition)` — replaces any prior rating for that theme
- Returns `{ success: true }`

### `GET /api/vote`
- Returns the current user's ratings for this edition: `{ votes: { [theme_id]: -1 | 0 | 1 } }`

### `GET /api/themes`
- Public. Returns approved themes for the current edition.
- **`score / positive / neutral / negative / voters` are all `0` unless the winning theme is announced** — keeps voters from being biased by current standings. Admins see live tallies via `/api/admin/results` (gated).
- If announced, also returns `{ winner: { theme_ar, theme_en } }`.

### Admin routes (all gated by the `gz_admin` HTTP-only session cookie — see Admin Panel Auth)

### `POST /api/admin/login`  ·  `POST /api/admin/logout`  ·  `GET /api/admin/check`
- `login`: body `{ password }`; constant-time compare against `ADMIN_SECRET`; on success sets an HMAC-signed HTTP-only `gz_admin` cookie (8h). Rate-limited (5 / 5 min per IP).
- `logout`: clears the cookie.
- `check`: returns `{ authorized: true }` / 401 — the admin page calls it on mount to decide whether to show the login form (JS can't read the HttpOnly cookie).

### `GET /api/admin/registrations` (protected)
- **Server-side paginated**: `?page=N&limit=M` (default 25, max 1000) → `{ participants, total, page, limit }`.
- `?edition=TAG` filters via `editions @> ARRAY[TAG]` (default = current edition; `?edition=all` = everyone ever). Tags are strings ("14", "13", "SE").
- `?all=1` streams the full filtered set (used by the CSV export) — internally paginates around Supabase's 1000-row cap.

### `GET /api/admin/suggestions` and `POST /api/admin/suggestions` (protected)
- `GET` is **server-side paginated + filterable**: `?status=all|pending|approved|rejected&page=N&limit=M`
  (default 10, max 200) → `{ suggestions, total, page, limit, status, counts }`.
- `approved` is **tri-state**: `TRUE` = approved, `FALSE` = rejected, `NULL` = pending. The status
  filter maps to `.eq("approved", true)` / `.eq("approved", false)` / `.is("approved", null)`.
- `counts` returns `{ all, pending, approved, rejected }` from four parallel `head: true` count
  queries (no rows transferred) — it drives the filter chips in the admin panel.
- `POST { id, approved: boolean | null }` sets the approval state.

### `GET /api/admin/results` (protected)
- Returns sorted live results per approved theme: net score, +1 / 0 / −1 counts, voter count. Plus total distinct voters.

### `POST /api/admin/set-theme` (protected)
- Body: `{ theme_ar, theme_en }`. Upserts `jam_phases.winning_theme_ar/en` for the current edition.

### `POST /api/admin/broadcast` (protected)
- Body: `{ subject, body_ar, body_en, editions? }`. Targeting: `editions: "all"` = everyone ever; `editions: ["13","SE"]` = anyone whose `editions[]` overlaps that list; omitted = current edition only. Paginates around the 1000-row cap, then sends a bilingual email via Resend one-at-a-time (rate limits).

### `GET /api/cron/spam-report` (bearer-token, not cookie)
- Triggered every 3 hours by GitHub Actions (`.github/workflows/spam-report.yml`), gated by `Authorization: Bearer ${CRON_SECRET}`.
- Auto-blocklists any name that appears >5 times in the last hour (adds it to the Upstash dynamic blocklist so `/api/register` shadowbans it immediately).
- Posts a summary (signups, top names, newly-blocked patterns, blocklist size) to `DISCORD_SPAM_WEBHOOK`.

---

## Email Templates

React-Email templates live in `emails/`. They share a dark `EmailShell` (see `emails/_shared.tsx`) and a `<Bilingual ar en />` helper that renders an RTL Arabic line + a muted English line.

| Template | When |
|---|---|
| `RegistrationConfirmation` | Sent automatically by `/api/register` on successful signup |
| `SuggestionWindowOpen` | Manual broadcast when suggestions open |
| `VotingWindowOpen` | Manual broadcast when voting opens |
| `ThemeAnnouncement` | Manual broadcast at jam start with the winning theme |
| `JamReminder` | Manual broadcast a few hours before the submission deadline |
| `BroadcastGeneral` | Used by `/api/admin/broadcast` for arbitrary Arabic + English messages |

All templates use the Game Zanga gradient (purple → orange-red) and link out to Discord + itch.io in the footer.

---

## Auth Flow (Supabase Magic Link)

Participants do NOT create passwords. Flow:

1. User registers via `/register` → API insert into `participants` **and** `supabase.auth.admin.createUser({ email, email_confirm: true })` so a confirmed auth user exists for them.
2. Later, user goes to `/suggest` or `/vote` and enters their email.
3. Site calls `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: '/auth/verify?next=...' } })`.
4. **Because the user already exists and `shouldCreateUser` is `false`**, Supabase sends the **Magic Link** email template (not the generic "Confirm Signup" one). Branding lives in the Supabase Dashboard → Auth → Email Templates → Magic Link.
5. If the email is *not* registered, Supabase returns a "Signups not allowed for otp" error, which the client translates to *"This email is not registered for the jam. Please register first."* (`err_not_registered_signin`).
6. User clicks link → lands on `/auth/verify` → session is established → redirected to the original destination.
7. Server-side, every authed API route cross-references `user.email` against the `participants` table for the current edition.

### Branding the Magic Link email

In Supabase Dashboard → **Authentication → Email Templates → Magic Link**:

- **Subject**: `رابط الدخول إلى زنقة الألعاب / Game Zanga sign-in link`
- **Body**: a dark, gradient-headlined HTML template with bilingual copy and a centered "تسجيل الدخول · Sign in" button linking to `{{ .ConfirmationURL }}`. The full HTML lives in this repo's git history (commit message: "Sign-in flow polish").

### Custom sender via Resend SMTP (recommended)

By default, Supabase auth emails come from `noreply@mail.app.supabase.io`. To send from `hello@gamezanga.net` instead, configure SMTP in **Project Settings → Auth → SMTP Settings**:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| User | `resend` |
| Password | your `RESEND_API_KEY` |
| Sender email | `hello@gamezanga.net` |
| Sender name | `Game Zanga` |

Requires `gamezanga.net` to be verified in Resend (Domains tab).

---

## Design Direction

- **Theme:** Dark, atmospheric, gaming culture — think game jam energy, not corporate
- **Primary language:** Arabic, RTL layout. English toggle available.
- **Colors:** Deep dark background (#0a0a0f), accent color electric purple or orange-red, white text
- **Typography:** Use a distinctive Arabic font (e.g. Cairo, Tajawal, or Noto Kufi Arabic) for Arabic content. Pair with a strong display font for English/numbers.
- **Countdown timer:** Prominent on homepage, animated, shows days/hours/minutes/seconds
- **Atmosphere:** Subtle particle effects or geometric patterns in background. Game jam posters displayed.
- **Mobile first:** Most participants are on phones.
- **RTL:** The entire site must be RTL by default. Language toggle switches to LTR English.

---

## Past Editions Data

`PAST_EDITIONS` (in [`lib/jam-config.ts`](lib/jam-config.ts)) holds the archive — currently 14 entries (Special Edition 2024 + editions 13 → 1). Rendered as a poster grid on `/about` via `EditionCard` in [`app/about/page.tsx`](app/about/page.tsx).

```ts
export type PastEdition = {
  edition: number | null;   // null for non-numbered special editions
  year: number;
  label_ar?: string;        // override the auto "النسخة N" label (used by special editions)
  label_en?: string;        // override "Edition N"
  poster_url: string;       // empty string = "No poster" placeholder
  itchio_url?: string;      // omit for editions 1–4 (predate itch.io)
  theme_ar?: string;
  theme_en?: string;
};
```

A non-numbered entry looks like:

```ts
{
  edition: null,
  year: 2024,
  label_ar: "النسخة الخاصة",
  label_en: "Special Edition",
  itchio_url: "https://itch.io/jam/gamezanga-specialedition",
  poster_url: "/images/editions/gz-special-2024.jpg",
}
```

### itch.io slug conventions

Slugs aren't fully consistent — editions 5 and 6 use `game-zanga-N` (with dashes), 7+ use `gamezangaN`, and the 2024 special edition is `gamezanga-specialedition`. When you add a new edition, look up the exact slug after creating the jam on itch.io. Editions 1–4 predate itch.io and have no link.

### Poster hosting

Posters are hosted locally under `public/images/editions/`. Filenames follow `gz<N>.jpg` (e.g. `gz12.jpg`), with `gz-special-2024.jpg` for the special edition. When adding a new edition, drop the new poster into that directory and point `poster_url` at the local path.

---

## Standalone deliverables (`docs/`)

Three self-contained HTML files that are **not part of the Next.js build** — open them directly in
a browser or publish them. Each inlines its own assets (Cairo woff2 subsets + the logos as data
URIs), so they work offline and render Arabic correctly with no network access.

> The two **standalone** files (`media-kit.html`, `social-post-generator.html`) need
> `<meta charset="utf-8">` in the first 1024 bytes. Opened over `file://` there is no
> `Content-Type` header, and Safari falls back to Windows-1252 — Arabic then renders as mojibake
> (`زنقة` → `Ø²ÙÙ‚Ø©`), including into any canvas export. `itchio-page.html` is the exception: it's
> a **fragment** for pasting into itch.io, so it carries no document-level tags at all.

### `docs/social-post-generator.html`
Canvas-based generator for branded artwork. Two modes:
- **Social post** — presets for IG post/portrait/story, X, Facebook/OG, LinkedIn, YouTube thumb,
  plus free width×height. Editable badge/tagline/meta/dates/CTA, logo tint, glows, grid, watermark.
- **Profile icon** — square-locked avatar presets (X 400, IG 320, Discord 512, master 1000) using
  the square logo, with a **preview-only** circle-crop guide. Export always re-renders offscreen so
  the guide can never reach the PNG.

The wide logo is tinted through its own alpha channel (canvas `source-in`), the same trick the site
hero uses via CSS `mask-image`. Text is optically centred using `measureText` bounding-box metrics
rather than a fixed offset, because Cairo's Arabic glyphs sit low in the em box.

### `docs/media-kit.html` + `docs/Game-Zanga-Media-Kit-2026.pdf` + `.docx`
Bilingual (Arabic-primary RTL, English as explicit LTR islands) partner/sponsor profile: audience
numbers, country/age/skill breakdowns, tool-fit cards, collaboration options, direct contact.

- Figures come from `scripts/media-kit-stats.mjs` — **re-run it and update the numbers by hand**
  before sending; they are not wired to the DB at render time.
- **The skills chart sums to ~179%, not 100%** — `تبدع في` is multi-select (≈1.8 skills/person).
  There is a callout under the chart saying so; do not "fix" the numbers.
- `@media print` swaps the dark palette for ink-on-paper and sets `@page { size: A4 }`.
  `h2`/`figcaption` need `break-inside: avoid` as well as `break-after` — each heading wraps an
  Arabic title plus a nested English sub-line, and a break between them strands the heading.
- The PDF is rendered with Puppeteer (`preferCSSPageSize: true`, `emulateMediaType("print")`,
  awaiting `document.fonts.ready`). Puppeteer is **not** a project dependency — install it in a
  scratch dir outside the repo when regenerating.
- **`Game-Zanga-Media-Kit-2026.docx`** is the editable version (for Google Docs / Word), built by
  `scripts/build-media-kit-docx.mjs` with the `docx` npm package — also **not** a project
  dependency, so `npm install docx` in a scratch dir to regenerate. It is a deliberate re-cut, not
  a conversion: light print palette (a dark-background Word file is unusable to edit or print), the
  CSS bar charts re-expressed as real tables, and RTL carried by `bidirectional` paragraphs +
  `rightToLeft` runs with the English blocks as LTR islands. The logo PNG is a white-on-alpha CSS
  mask, so it must be **tinted before embedding** or it lands invisible on a white page.
  Update the figures here whenever `media-kit.html` changes — the two are not linked.

### `scripts/add-theme-suggestions.mjs`
Bulk-inserts organiser-curated themes into the review queue as pending (`approved: null`,
`participant_id: null`). Duplicate detection normalises Arabic — strips tashkeel, unifies أ/ا and
ة/ه, ignores a leading ال — so `الاحلام` matches `أحلام`. On a duplicate it **deletes the old row
and inserts the curated pair**, but aborts first if any duplicate carries votes, since
`votes.theme_id` is `ON DELETE CASCADE`. Supports `--dry-run`.

---

## Admin Panel Auth

The admin panel at `/admin` is protected by a single secret env var (`ADMIN_SECRET`), not Supabase auth.

**Auth is HTTP-only-cookie based** (was `sessionStorage` + `x-admin-secret` header until the security hardening pass — that was XSS-exfiltratable, so it was replaced):

1. Admin enters the secret → `POST /api/admin/login` compares it constant-time (`comparePassword` in `lib/admin-auth.ts`).
2. On success the server sets an **HMAC-signed, HttpOnly, SameSite=Strict, Secure** cookie `gz_admin` with an 8-hour expiry. JS can't read it, so an XSS bug elsewhere can't steal the admin secret.
3. Every `/api/admin/*` route calls `await isAdminAuthorized()` which verifies the cookie's HMAC + expiry. Admin mutating routes (`suggestions` POST, `set-theme`, `broadcast`) additionally enforce `isSameOrigin`.
4. `/admin` calls `GET /api/admin/check` on mount to know whether to show the login form; logout hits `POST /api/admin/logout`.

To rotate: change `ADMIN_SECRET` in Vercel and redeploy — all existing cookies instantly become invalid (their HMAC no longer verifies).

---

## Security

The public `/register` form was hit by a mass-signup bot attack (42k+ fake rows in one run). The following layered defenses were added — the helper libs are small and reusable.

### Request-guard helpers (`lib/`)
| Helper | File | What it does |
|---|---|---|
| `isSameOrigin(req)` | `csrf.ts` | Rejects cross-origin POSTs by comparing `Origin`/`Referer` to `NEXT_PUBLIC_SITE_URL`. Fails **open** if the env var is unset. |
| `checkRateLimit(req, {bucket,limit,windowSeconds})` | `ratelimit.ts` | Sliding-window IP rate limit via Upstash. Fails **open** if Upstash env vars are unset. Buckets: `register` 10/10min, `suggest` 20/10min, `vote` 60/min, `admin-login` 5/5min. |
| `verifyTurnstile(token, req)` | `turnstile.ts` | Server-side Cloudflare Turnstile siteverify. Fails **open** if `TURNSTILE_SECRET_KEY` unset. |
| `checkSpamSignature({full_name,email})` | `spam-filter.ts` | Static blocklist (known bot names + UUID-email regex) **plus** a dynamic Upstash set (`blocklist:names`) populated by the cron. On match `/api/register` returns **fake success** (shadowban). |
| `dbErrorResponse(context, err)` | `api-errors.ts` | Logs the real DB error server-side, returns a generic `{ message: "Internal error" }` so schema details don't leak to clients. Used by admin routes. |

### Client-side
- `components/forms/Turnstile.tsx` renders the invisible/managed Cloudflare widget on `/register`; the token is sent in the POST body and the submit button is disabled until it arrives. Renders nothing if `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is unset.

### Other hardening done in the same pass
- **Profile-hijacking blocked**: re-registration only appends an edition tag; it never overwrites an existing row's name/mobile/country/skills.
- **Open-redirect closed**: `/auth/verify` validates `?next=` is a same-origin relative path.
- **CSP + security headers** in `next.config.ts` (`Content-Security-Policy` allowing `challenges.cloudflare.com`, `X-Frame-Options: DENY`, HSTS, `Referrer-Policy`, `Permissions-Policy`).
- **RLS verified**: `scripts/verify-rls.mjs` confirms the anon key can't read/write/delete any table (jam_phases now has RLS too).
- **`MAINTENANCE_MODE=true`** is the emergency kill switch for `/register` (returns 503 before any work).

### Managing the dynamic blocklist
It's an Upstash set at key `blocklist:names` (lowercased names). The 3-hourly cron auto-adds names with >5 hits/hour. To inspect or remove entries, use the Upstash console or a small `@upstash/redis` script (`smembers` / `srem`).

### Incident cleanup scripts (`scripts/`, gitignored data)
`cleanup-spam.mjs` / `cleanup-full.mjs` delete spam `participants` rows (by name signature / UUID emails) **and** the orphaned Supabase auth users. `find-spam-patterns.mjs`, `recent-ed14.mjs`, `check-state.mjs`, `check-typos.mjs`, `fix-typos.mjs` are diagnostics. All are one-off, service-role, run locally with `node --env-file=.env.local`.

---

## Deployment

| What | Where |
|---|---|
| Hosting | Vercel — project linked to `Game-Zanga/gamezanga-website` on GitHub |
| Auto-deploy | every push to `main` → ~60s build |
| Canonical URL | `https://www.gamezanga.net` |
| Apex `gamezanga.net` | 308 redirects to `www.gamezanga.net` (configured in Vercel → Domains) |
| SSL | auto-provisioned by Vercel (Let's Encrypt) |
| Env vars | set in Vercel → Settings → Environment Variables (same keys as `.env.example`) |
| `NEXT_PUBLIC_SITE_URL` in prod | `https://www.gamezanga.net` |
| `ADMIN_SECRET` in prod | a *different* value than dev — generated with `openssl rand -hex 32`, kept in a password manager |

**Env var changes require a manual redeploy** — Vercel doesn't apply them retroactively. Trigger via Deployments → ⋯ on latest → Redeploy.

### Third-party integrations (added post-launch)

- **Upstash Redis** — added via Vercel → Storage → Upstash (region `iad1`, eviction on, Free plan). Injects `KV_REST_API_URL` / `KV_REST_API_TOKEN`. Powers rate limiting and the dynamic spam blocklist. Without it those features fail open.
- **Cloudflare Turnstile** — a "Managed" widget for `www.gamezanga.net` + `gamezanga.net` + `localhost`. Site key and secret go in Vercel env vars.
- **GitHub Actions spam-report cron** — `.github/workflows/spam-report.yml` runs every 3h and curls `/api/cron/spam-report` with `Authorization: Bearer ${CRON_SECRET}`. Set `CRON_SECRET` as **both** a Vercel env var and a GitHub Actions repo secret (same value). Vercel Hobby cron can't do sub-daily, hence GitHub Actions.

### Supabase Auth — production URLs

In **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL**: `https://www.gamezanga.net`
- **Redirect URLs** (allowlist): `https://www.gamezanga.net/auth/verify` *(plus `http://localhost:3000/auth/verify` for dev)*

Without this, magic-link sign-ins from production bounce back to `localhost`.

### Email — Resend

- `gamezanga.net` is **verified** in Resend (SPF + DKIM TXT records live in DNS alongside the Vercel records).
- Registration confirmations sent directly by `/api/register` via Resend, from `hello@gamezanga.net`.
- Supabase's Magic Link emails are also routed through Resend, configured in **Supabase → Project Settings → Auth → SMTP Settings**. See the Auth Flow section for the SMTP config.

### DNS

DNS lives at the domain registrar (not Vercel nameservers, to keep email DNS untouched). Records:

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` *(Vercel anycast)* |
| `CNAME` | `www` | `cname.vercel-dns.com` |
| `TXT` | `@` | `v=spf1 include:_spf.resend.com ~all` |
| `TXT` | `resend._domainkey` | *(provided by Resend)* |
| `TXT` | `_dmarc` | `v=DMARC1; p=none;` *(optional)* |

---

## Folder Structure

```
/
├── app/
│   ├── layout.tsx              # Root layout — reads locale cookie, sets <html lang/dir>, loads fonts
│   ├── globals.css             # Tailwind v4 entry + @theme tokens + dark palette + .card-glow / .btn / .input
│   ├── page.tsx                # Home
│   ├── about/page.tsx
│   ├── rules/page.tsx
│   ├── register/page.tsx
│   ├── suggest/page.tsx
│   ├── vote/page.tsx
│   ├── admin/page.tsx
│   ├── auth/verify/page.tsx
│   └── api/
│       ├── register/route.ts        # upsert-by-email + full security gauntlet (see API Routes)
│       ├── suggest/route.ts
│       ├── vote/route.ts            # POST upserts a rating; GET returns the user's ratings map
│       ├── themes/route.ts          # Public themes list — scores hidden until announced
│       ├── cron/
│       │   └── spam-report/route.ts # 3-hourly: auto-blocklist + Discord report (bearer-token)
│       └── admin/
│           ├── login/route.ts       # password → HTTP-only gz_admin cookie
│           ├── logout/route.ts
│           ├── check/route.ts        # is the cookie valid? (admin page mount)
│           ├── registrations/route.ts # server-side paginated; ?edition=, ?all=1
│           ├── suggestions/route.ts # GET list + POST approval state
│           ├── results/route.ts     # Live per-theme score + breakdown (admin-only)
│           ├── set-theme/route.ts
│           └── broadcast/route.ts   # edition-targeted bilingual email
├── components/
│   ├── LocaleProvider.tsx           # Locale context + cookie persistence + tr()
│   ├── WinningTheme.tsx             # Renders the announced winner on /vote post-reveal
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── home/
│   │   ├── Hero.tsx
│   │   ├── Countdown.tsx
│   │   ├── Steps.tsx
│   │   ├── About.tsx
│   │   ├── JudgingCriteria.tsx
│   │   └── Partners.tsx
│   ├── auth/
│   │   └── SignInGate.tsx           # Email → magic link UI; gates /suggest and /vote
│   ├── forms/
│   │   ├── RegisterForm.tsx         # includes Turnstile widget + token gating
│   │   ├── Turnstile.tsx            # Cloudflare Turnstile loader/renderer
│   │   ├── SuggestForm.tsx
│   │   └── VoteForm.tsx             # +1 / 0 / −1 per theme with instructions card
│   └── ui/
│       └── PhaseGate.tsx            # Renders children only during certain phases
├── emails/
│   ├── _shared.tsx                  # EmailShell + Bilingual helper
│   ├── RegistrationConfirmation.tsx
│   ├── SuggestionWindowOpen.tsx
│   ├── VotingWindowOpen.tsx
│   ├── ThemeAnnouncement.tsx
│   ├── JamReminder.tsx
│   └── BroadcastGeneral.tsx
├── lib/
│   ├── jam-config.ts                # ← EDIT THIS EACH YEAR. Dates, edition number, itch URL, past editions.
│   ├── phase-utils.ts               # getCurrentPhase(), isRegistrationOpen(), isVotingOpen(), timeUntil(), …
│   ├── i18n.ts                      # Translations dictionary + tr() / trCode() + COUNTRIES list
│   ├── content.ts                   # Long-form bilingual copy: rules list, FAQ, about
│   ├── date-format.ts               # Arabic date range w/ Levantine month names (آب/تموز); used by Hero
│   ├── validation.ts                # Server-side registration validation (returns error codes)
│   ├── admin-auth.ts                # HMAC-signed gz_admin cookie: create/verify + comparePassword()
│   ├── csrf.ts                      # isSameOrigin() same-origin check
│   ├── ratelimit.ts                 # checkRateLimit() — Upstash sliding window (fails open)
│   ├── turnstile.ts                 # verifyTurnstile() — Cloudflare siteverify (fails open)
│   ├── spam-filter.ts               # checkSpamSignature() — static + dynamic (Upstash) blocklist
│   ├── api-errors.ts                # dbErrorResponse() — sanitized 500s (no schema leak)
│   ├── supabase-browser.ts          # createBrowserClient() for client components
│   ├── supabase-server.ts           # getServerClient() + getServiceClient() — uses next/headers, server-only
│   └── resend.ts                    # Cached Resend client + EMAIL_FROM
├── scripts/                         # One-off maintenance (run `node --env-file=.env.local <script>`)
│   ├── import-legacy-registrations.mjs # CSV → participants upsert (editions[]); typo-normalizes emails
│   ├── cleanup-spam.mjs / cleanup-full.mjs # delete spam rows + orphan auth users
│   ├── verify-rls.mjs               # anon-key RLS audit (read/write/delete blocked?)
│   ├── add-theme-suggestions.mjs    # bulk-insert curated themes as pending; --dry-run; see below
│   ├── media-kit-stats.mjs          # read-only participant stats for the media kit
│   ├── build-og-image.py            # renders public/og.png (social share card)
│   ├── build-media-kit-docx.mjs     # renders the editable .docx media kit
│   ├── find-spam-patterns.mjs / recent-ed14.mjs / check-state.mjs / check-typos.mjs / fix-typos.mjs
│   └── legacy-data/                 # gitignored — legacy CSVs (personal data, never commit)
├── docs/                            # Standalone deliverables — not part of the Next.js build
│   ├── itchio-page.html             # RTL Arabic HTML for the itch.io jam description
│   ├── media-kit.html               # bilingual partner/sponsor media kit (see Media Kit below)
│   ├── Game-Zanga-Media-Kit-2026.pdf # A4 PDF rendered from media-kit.html
│   └── social-post-generator.html   # canvas tool: branded social posts + profile icons
├── .github/workflows/
│   └── spam-report.yml              # every-3h cron → /api/cron/spam-report
├── public/
│   └── images/
│       ├── editions/                # Past-edition posters (gz1.jpg … gz13.jpg, gz-special-2024.jpg)
│       ├── partners/                # Partner + media-partner logos (.png)
│       ├── gz-logo.png              # wide wordmark (masked/tinted in Hero)
│       └── gz-squarelogo.png        # square logo (navbar avatar)
├── next.config.ts                   # CSP + security headers
├── CLAUDE.md                        # This file — project brief + reference
├── README.md                        # Setup + workflow
├── .env.local                       # Secrets (never commit this)
└── .env.example                     # Template of env vars (safe to commit)
```

---

## Rules Content (from existing site — keep this text)

### Game Submission Rules
- Platforms: Browser or Windows desktop (browser strongly recommended)
- Keep download size as small as possible
- All technologies allowed
- Language: Arabic or English (Arabic preferred if text is present)
- Theme: Must incorporate the announced jam theme
- Work must begin after the theme announcement
- Pre-existing code/assets from your own other projects are allowed as long as the jam game itself is built during the 72 hours
- Third-party assets (code, art, audio, AI-generated content) must be open source, purchased, or licensed — and must be credited
- AI-generated content must include the tool name and prompts used
- Game IP belongs to the developer(s)

### Judging Criteria
1. **Theme adherence** — How well does the game use or interpret the theme?
2. **Fun factor** — Is it enjoyable? Good controls? Replay value?
3. **Creativity** — Is the idea original? Unexpected interpretation?
4. **Visuals** — Art quality, aesthetics, art direction
5. **Audio** — Sound effects and music quality

### FAQ
- **What is Game Zanga?** An Arabic game jam where developers build games in 72 hours around a surprise theme. Inspired by Global Game Jam and Ludum Dare.
- **When?** Once a year, a Thursday–Sunday summer weekend
- **Where?** Fully online via Discord and itch.io
- **Who can participate?** Anyone interested in game development — programmers, artists, designers, musicians. Any age, any skill level.
- **Is it open to people outside the region?** Yes, fully online and open to all Arab-speaking participants worldwide
- **What is the theme?** A constraint announced at jam start to encourage creativity and ensure fair starts
- **Is theme adherence required?** Yes
- **What happens to submitted games?** They are hosted on itch.io and reviewed by other participants. Best games are featured on Game Zanga's channels.
- **Who owns the games?** The developers who made them
- **How many levels/how much content?** No requirements — quality over quantity. Balance fun vs. scope.
- **2D only?** No — 2D, 2.5D, and 3D are all allowed

---

## Social Links

- Discord: https://discord.gg/xvxEPtrzgu
- Twitter/X: https://twitter.com/GameZanga
- YouTube: https://www.youtube.com/@gamezanga
- LinkedIn: https://www.linkedin.com/company/gamezanga
- Instagram: https://www.instagram.com/gamezanga/
- Facebook: https://www.facebook.com/GameZanga

---

## Conventions & gotchas worth knowing

- **Supabase client is split into two files**: `lib/supabase-browser.ts` (client components) and `lib/supabase-server.ts` (server components + route handlers). The server file imports `next/headers` and *will break the build* if you accidentally import it from a client component. Pick the right one for the file you're in.
- **The service role key is only used server-side** (`getServiceClient()` in `lib/supabase-server.ts`). Never import it into client code.
- **Errors travel as codes, not strings.** API routes return `{ code: "err_xxx" }` (or `{ errors: [{ field, code }] }` for field validation). The client translates with `trCode(code, locale)` from `lib/i18n.ts`. Add a new translation key any time you add a new error code.
- **Tailwind v4 is CSS-first**: theme tokens live in `@theme { ... }` inside `app/globals.css`, not in a `tailwind.config.js`. Adding a new colour means adding a `--color-*` variable there.
- **The phase is computed at runtime from dates** in `lib/jam-config.ts`. There is no scheduler. Editing the dates immediately changes what pages are open. Useful for testing — push a date into the past, reload, the gate opens.
- **SVG icons need explicit `width`/`height` attributes**, not `className="w-N h-N"` on a `<span>` wrapper. Inline `<span>` doesn't honor width/height, so the SVG falls back to its default browser size (~300×150). Pattern used in `VoteForm.tsx`: `<svg width={size} height={size} viewBox="0 0 24 24" ...>`.
- **`participants.editions` is `TEXT[]`, not an integer.** Filter with `.contains("editions", ["14"])` (SQL `editions @> ARRAY['14']`), never `.eq("edition", 14)`. Tags are strings — the Special Edition is `"SE"`. Only `participants` uses the array; `theme_suggestions` / `votes` / `jam_phases` still use singular `edition INTEGER`.
- **`isAdminAuthorized()` is now async and takes no args** — it reads the `gz_admin` cookie via `next/headers`. Call it as `if (!(await isAdminAuthorized())) …`. (It used to take the `req` and read a header.)
- **Security helpers fail open when unconfigured.** `isSameOrigin`, `checkRateLimit`, `verifyTurnstile`, and the dynamic blocklist all allow the request if their env vars are missing — great for local dev, but it means a missing prod env var silently disables that protection. Verify all keys are set in Vercel after any env change.
- **Don't `.eq("email", …)` for the current-user lookup and also filter by edition with `.eq`** — participant rows are global; scope by `editions` containment instead.
- **`theme_suggestions.approved` is tri-state, not a boolean.** `TRUE` = approved, `FALSE` = rejected, `NULL` = pending. Query pending with `.is("approved", null)` — `.eq("approved", null)` does **not** work in SQL. Anywhere you branch on it, handle all three.
- **Supabase silently caps `.select()` at 1000 rows.** This has bitten this repo twice (the registrations table, then the suggestions queue) — both times the UI looked fine while quietly hiding data. Any endpoint that can exceed 1000 rows must paginate with `.range(from, to)` in a loop or accept `?page=`/`?limit=`. Use `{ count: "exact" }` for totals and `{ count: "exact", head: true }` for count-only queries (no rows transferred).
- **Any list UI that re-fetches on a filter change needs a request-sequence guard.** Switching filters quickly leaves two loads in flight and the slower response can overwrite the newer one. `SuggestionsPanel` keeps a monotonic `useRef` counter and drops superseded responses; it also clears rows on filter change so the previous filter's cards don't linger during the fetch.
- **Standalone `docs/*.html` need `<meta charset="utf-8">` in the first 1024 bytes** — opened over `file://` there's no `Content-Type` header, and Safari decodes UTF-8 as Windows-1252, turning Arabic into mojibake. Applies to `media-kit.html` and `social-post-generator.html`. **`itchio-page.html` deliberately has none**: it's a fragment pasted into itch.io's description field (which supplies its own charset), and that sanitiser renders stray non-content tags as visible text — it ate HTML comments once already.
- **Tests passed once with this stack** but there are no automated tests in the repo. Verifications were done by running `npm run build` (or `npx tsc --noEmit`) after each significant change.

---

## Notes for Future Editions

Each year, the routine is:

1. **Edit `lib/jam-config.ts`** — edition number, jam start/end, phase windows, itch URL. Move the just-finished edition into `PAST_EDITIONS` with its winning theme.
2. **In Supabase SQL Editor**:
   ```sql
   INSERT INTO jam_phases (edition, current_phase)
   VALUES (15, 'pre_registration')
   ON CONFLICT (edition) DO NOTHING;

   -- participants.editions is TEXT[] — bump its default to the new tag.
   ALTER TABLE participants      ALTER COLUMN editions SET DEFAULT ARRAY['15'];
   -- theme_suggestions / votes still use singular INTEGER edition:
   ALTER TABLE theme_suggestions ALTER COLUMN edition SET DEFAULT 15;
   ALTER TABLE votes             ALTER COLUMN edition SET DEFAULT 15;
   ```
   The app filters participants by `.contains("editions", [String(edition)])`, so bumping `JAM_CONFIG.edition` is what actually switches the site over; the DB default just keeps manual inserts tidy.
3. **Update partner / media-partner logos and links** in [`components/home/Partners.tsx`](components/home/Partners.tsx). Each entry takes `{ src, alt, href? }`, hosted locally under `public/images/partners/`.
4. **Rotate `ADMIN_SECRET`** for production via Vercel env vars (also invalidates all existing `gz_admin` cookies).
5. **Update `docs/itchio-page.html`** with the new dates (uses Levantine month names, e.g. آب for August, تموز for July) and re-paste into the itch.io description.
6. **Refresh the outward-facing collateral in `docs/`**:
   - `social-post-generator.html` — update the default badge/tagline/dates in the Content panel.
   - `media-kit.html` — re-run `scripts/media-kit-stats.mjs`, hand-update the figures and the
     `PAST_EDITIONS`-derived counts, then re-render the PDF with Puppeteer.
   - `public/og.png` — the card every shared link renders. Re-run
     `python3 scripts/build-og-image.py` after changing the edition number or jam dates
     (it bakes both in as text). The surrounding `<meta>` tags in `app/layout.tsx` derive
     themselves from `JAM_CONFIG` and need no edit.
7. **Consider `MAINTENANCE_MODE`** during the pre-launch window if bots return; the spam blocklist (`blocklist:names` in Upstash) persists across editions and can be pruned via the Upstash console.

Everything else stays the same.

---

## Session log — what changed and why

Reverse-chronological. Useful for understanding *why* something looks the way it does.

| Change | Reason |
|---|---|
| Suggestions queue: server pagination + status filters + counts | 100 suggestions rendered as one unbroken wall; also closed the same 1000-row truncation risk the registrations table had |
| `docs/media-kit.html` + PDF | Qwacks (game-dev tooling platform) asked for a ملف تعريفي for a potential collaboration |
| `docs/social-post-generator.html` | Reusable branded artwork at any size, instead of one-off posts |
| Arabic date format w/ Levantine months (`lib/date-format.ts`) | "13 أغسطس 2026" → "الخميس ١٣ اغسطس (آب) …" so it reads naturally across the Arab region |
| Edition 14 postponed to 13–16 Aug 2026 | Was 2–5 Jul |
| Turnstile + Upstash rate limiting + spam blocklist + `MAINTENANCE_MODE` | 42k-row mass-signup bot attack on `/register`; see **Security** |
| `participants.edition` → `editions TEXT[]` | One row per person accumulating edition tags, so ~2.3k legacy registrations across editions 12/SE/13 could be imported without duplicating people |
| Admin auth → HTTP-only signed cookie | `ADMIN_SECRET` in `sessionStorage` was XSS-exfiltratable |
