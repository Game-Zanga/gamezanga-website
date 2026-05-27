# Game Zanga Website — Claude Code Project Brief

> This file is the single source of truth for this project.
> Read it fully before writing any code or making any decisions.

> **Status**: Live in production at **<https://www.gamezanga.net>** (apex `gamezanga.net` 308-redirects to `www`). Deployed on Vercel from the `Game-Zanga/gamezanga-website` GitHub repo — every push to `main` auto-deploys.

---

## What Is Game Zanga?

Game Zanga (زنقة الألعاب) is a well-known Arabic-language game jam — a 72-hour online event where Arab game developers and enthusiasts build games around a surprise theme. It is held once a year, typically on a Thursday–Sunday weekend in summer. This is **edition 14** (Thu 2 Jul – Sun 5 Jul 2026, KSA). The community spans the entire Arab world and participates remotely via Discord and itch.io.

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

# Admin panel — long random secret; generate with `openssl rand -hex 32`
ADMIN_SECRET=replace-with-long-random-string

# Public site URL (used for magic-link email redirects)
# Dev:  http://localhost:3000
# Prod: https://www.gamezanga.net
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Never commit `.env.local` to git.** Use a *different* `ADMIN_SECRET` in production than in dev — generate a fresh one with `openssl rand -hex 32` and set it in Vercel's env vars, *not* in this file.

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

  // Jam dates (Saudi time = UTC+3)
  jam_start: "2026-07-02T20:00:00+03:00", // Thursday 8pm
  jam_end:   "2026-07-05T22:00:00+03:00", // Sunday 10pm

  // Phase dates
  registration_open:  "2026-05-25T00:00:00+03:00",
  registration_close: "2026-07-05T23:59:00+03:00", // open through the jam itself
  suggestion_open:    "2026-05-27T00:00:00+03:00",
  suggestion_close:   "2026-06-15T23:59:00+03:00",
  voting_open:        "2026-06-19T00:00:00+03:00", // TBD — adjust
  voting_close:       "2026-06-28T23:59:00+03:00", // TBD — adjust
  theme_announced:    "2026-07-02T20:00:00+03:00", // = jam_start

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
- View all registrations (table, exportable to CSV in the client)
- View all theme suggestions (approve / reject / un-approve)
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
  edition INTEGER NOT NULL DEFAULT 14
);

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

-- Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

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

البريد الإلكتروني / Email        [required] [email, unique per edition]
  - Label note: هو الوسيلة الرئيسية للتواصل

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

### `POST /api/register`
- Validates form fields (`lib/validation.ts`)
- Checks registration is open (using jam-config dates)
- Inserts into `participants` using service role
- **Pre-creates a Supabase auth user via `supabase.auth.admin.createUser()` (email_confirm: true)** — this ensures future sign-ins via `/suggest` and `/vote` hit Supabase's **Magic Link** template (which is branded) instead of the generic "Confirm Signup" template
- Sends confirmation email via Resend
- Returns `{ success: true, id: uuid }`

### `POST /api/suggest`
- Requires authenticated user (Supabase session)
- Checks suggestion window is open
- Checks the user is a registered participant for the current edition
- Checks they haven't exceeded `max_suggestions_per_user`
- Inserts into `theme_suggestions`
- Returns `{ success: true }`

### `POST /api/vote`
- Requires authenticated user (Supabase session)
- Checks voting window is open
- Body: `{ theme_id: uuid, value: -1 | 0 | 1 }`
- **Upserts** by `(participant_id, theme_id, edition)` — replaces any prior rating for that theme
- Returns `{ success: true }`

### `GET /api/vote`
- Returns the current user's ratings for this edition: `{ votes: { [theme_id]: -1 | 0 | 1 } }`

### `GET /api/themes`
- Public. Returns approved themes for the current edition.
- **`score / positive / neutral / negative / voters` are all `0` unless the winning theme is announced** — keeps voters from being biased by current standings. Admins see live tallies via `/api/admin/results` (gated).
- If announced, also returns `{ winner: { theme_ar, theme_en } }`.

### `GET /api/admin/registrations` (protected)
- Returns all participants for the current edition (admin panel populates the registrations table from this).

### `GET /api/admin/suggestions` and `POST /api/admin/suggestions` (protected)
- `GET` lists all suggestions for the current edition (approved + pending + rejected).
- `POST { id, approved: boolean | null }` sets the approval state.

### `GET /api/admin/results` (protected)
- Returns sorted live results per approved theme: net score, +1 / 0 / −1 counts, voter count. Plus total distinct voters.

### `POST /api/admin/set-theme` (protected)
- Body: `{ theme_ar, theme_en }`. Upserts `jam_phases.winning_theme_ar/en` for the current edition.

### `POST /api/admin/broadcast` (protected)
- Body: `{ subject, body_ar, body_en }`. Fetches all participant emails for the current edition and sends a bilingual email via Resend (one at a time to stay within rate limits).

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

## Admin Panel Auth

The admin panel at `/admin` is protected by a simple secret environment variable (not Supabase auth, to keep it simple):

```
ADMIN_SECRET=your-long-random-secret-here
```

The admin enters this secret on the `/admin` login page. It's stored in `sessionStorage` and sent as a header with every admin API call.

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
│       ├── register/route.ts
│       ├── suggest/route.ts
│       ├── vote/route.ts            # POST upserts a rating; GET returns the user's ratings map
│       ├── themes/route.ts          # Public themes list — scores hidden until announced
│       └── admin/
│           ├── registrations/route.ts
│           ├── suggestions/route.ts # GET list + POST approval state
│           ├── results/route.ts     # Live per-theme score + breakdown (admin-only)
│           ├── set-theme/route.ts
│           └── broadcast/route.ts
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
│   │   ├── RegisterForm.tsx
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
│   ├── validation.ts                # Server-side registration validation (returns error codes)
│   ├── admin-auth.ts                # Constant-time ADMIN_SECRET check
│   ├── supabase-browser.ts          # createBrowserClient() for client components
│   ├── supabase-server.ts           # getServerClient() + getServiceClient() — uses next/headers, server-only
│   └── resend.ts                    # Cached Resend client + EMAIL_FROM
├── public/
│   └── images/                      # Logos, posters, partner images (mostly empty; add as needed)
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
- **Tests passed once with this stack** but there are no automated tests in the repo. Verifications were done by running `npm run build` after each significant change.

---

## Notes for Future Editions

Each year, the routine is:

1. **Edit `lib/jam-config.ts`** — edition number, jam start/end, phase windows, itch URL. Move the just-finished edition into `PAST_EDITIONS` with its winning theme.
2. **In Supabase SQL Editor**:
   ```sql
   INSERT INTO jam_phases (edition, current_phase)
   VALUES (15, 'pre_registration')
   ON CONFLICT (edition) DO NOTHING;

   -- optional: bump DB defaults so manual queries match
   ALTER TABLE participants      ALTER COLUMN edition SET DEFAULT 15;
   ALTER TABLE theme_suggestions ALTER COLUMN edition SET DEFAULT 15;
   ALTER TABLE votes             ALTER COLUMN edition SET DEFAULT 15;
   ```
3. **Update partner / media-partner logos and links** in [`components/home/Partners.tsx`](components/home/Partners.tsx). Each entry takes `{ src, alt, href? }`. Currently the 12 partners + 4 media partners from edition 13 are wired up, hosted locally under `public/images/partners/`. For a new edition, drop the new logos into that directory and update the lists — `src` should be a local path like `/images/partners/saudi-game-news.png`.
4. **Rotate `ADMIN_SECRET`** for production via Vercel env vars.

Everything else stays the same.
