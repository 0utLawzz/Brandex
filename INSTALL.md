# Brandex Installation & Deployment Guide

**Last Updated:** September 6, 2026  
**Live app:** https://brandexsheet.vercel.app/

This guide covers local setup, Supabase, Google Sheet mirror, and Vercel deployment for the current **Supabase-primary** architecture.

---

## Table of contents

1. [Prerequisites](#prerequisites)
2. [Local installation](#local-installation)
3. [Environment variables](#environment-variables)
4. [Supabase setup](#supabase-setup)
5. [Google Apps Script mirror](#google-apps-script-mirror)
6. [One-time Sheet import](#one-time-sheet-import)
7. [Edge Function sync](#edge-function-sync)
8. [Vercel deployment](#vercel-deployment)
9. [Security hardening checklist](#security-hardening-checklist)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js 20+** — https://nodejs.org/
- **pnpm** — `npm install -g pnpm`
- **Git**
- Accounts: GitHub, Supabase, Vercel, Google (for Apps Script + Sheet)

---

## Local installation

```bash
git clone https://github.com/0utLawzz/Brandex.git
cd Brandex
pnpm install --frozen-lockfile
cp .env.example .env
```

Edit `.env` with browser-safe values only:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Run the web app:

```bash
pnpm dev
```

Typecheck / build:

```bash
pnpm typecheck
pnpm build
```

---

## Environment variables

### Browser / Vercel (only these on the frontend)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon / publishable key |

### Server / Edge / import only (never commit, never VITE_*)

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Same project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (import + Edge Function) |
| `GOOGLE_APPS_SCRIPT_URL` | Deployed Web App `/exec` URL |
| `GOOGLE_APPS_SCRIPT_SECRET` | Must match Apps Script property `BRANDEX_MIRROR_SECRET` |
| `SHEET_SYNC_CRON_SECRET` | Bearer token for Edge Function invocation |

---

## Supabase setup

1. Create a Supabase project.
2. Run migrations in the SQL editor (in order):
   - `supabase/migrations/202608280001_brandex_datasheet.sql`
   - `supabase/migrations/202608280002_allow_duplicate_case_references.sql`
3. **Authentication → Users**: create or invite staff. New users get role `viewer`.
4. Promote users as needed:

```sql
update public.profiles
set role = 'admin'  -- or 'editor'
where user_id = (select id from auth.users where email = 'owner@example.com');
```

5. **Disable public sign-ups** in Auth settings.
6. Confirm storage bucket for logos is **private** (signed URLs only).

Roles:
- `viewer` — read-only
- `editor` — create / update
- `admin` — delete + user administration

---

## Google Apps Script mirror

1. Open the target Google Spreadsheet → Extensions → Apps Script.
2. Paste contents of `google-apps-script/Code.gs`.
3. Deploy → New deployment → Web app:
   - Execute as: **Me**
   - Who has access: **Anyone with the link** (secret still required in body)
4. Copy the `/exec` URL.
5. Project Settings → Script properties → add:
   - `BRANDEX_MIRROR_SECRET` = long random string

Preferred sheet tabs (case-insensitive + legacy fallbacks):
- `DATABASE`, `LOGS`, `ARCHIVE`

---

## One-time Sheet import

Use a local terminal only (service role never goes to Vercel frontend):

```bash
export SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=...
export GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
export GOOGLE_APPS_SCRIPT_SECRET=same-as-BRANDEX_MIRROR_SECRET

pnpm import:sheet
```

Idempotent by record ID. Supports modern `mirrorExport` and legacy list fallback.

---

## Edge Function sync

1. Deploy `supabase/functions/sync-google-sheet`.
2. Set secrets:
   - `GOOGLE_APPS_SCRIPT_URL`
   - `GOOGLE_APPS_SCRIPT_SECRET`
   - `SHEET_SYNC_CRON_SECRET`
   - service role / project URL as required by the function
3. Schedule invocations with header:
   `Authorization: Bearer <SHEET_SYNC_CRON_SECRET>`
4. Function processes up to 50 pending/failed outbox items per run.

---

## Vercel deployment

1. Connect the GitHub repo to Vercel (or `vercel` from repo root).
2. Set **only**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. `vercel.json` builds `@workspace/tm-tracker` and serves `artifacts/tm-tracker/dist`.
4. Production URL target: **https://brandexsheet.vercel.app/**

---

## Security hardening checklist

Use this before treating production as locked down:

- [ ] Public sign-up disabled in Supabase Auth
- [ ] Only `VITE_SUPABASE_*` present on Vercel Preview + Production
- [ ] Service role key never in frontend env or git
- [ ] `BRANDEX_MIRROR_SECRET` set and matches Edge/import secret
- [ ] Storage bucket private; logos via signed URLs only
- [ ] Test accounts: one `viewer`, one `editor`, one `admin` — RLS behaves correctly
- [ ] Sheet mirror: create/update/delete in UI → outbox → Sheet + ARCHIVE
- [ ] `.env` and secrets listed in `.gitignore`
- [ ] `pnpm audit` reviewed periodically

Full policy: see `SECURITY.md`.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Blank app / auth fail | `VITE_SUPABASE_*` values, project URL, anon key |
| Cannot write records | User role on `profiles` (`editor` or `admin`) |
| Import fails | Service role, Apps Script URL, secret match, Web App redeployed with latest `Code.gs` |
| Sheet not updating | Edge Function secrets, cron auth header, outbox rows in `pending`/`failed` |
| Build fails on Vercel | Node 20+, `pnpm install`, only allowed env vars |

---

## Related docs

- `README.md` — architecture overview
- `AGENTS.md` — project guidelines
- `DEV_NOTES.md` — developer internals
- `Progress.md` — status log
- `SECURITY.md` — vulnerability reporting + hardening

**Maintainer:** Nadeem (OutLawZ) — [@0utLawzz](https://github.com/0utLawzz)
