# Brandex — Developer Notes

Internal architecture notes for developers working on this codebase.

**Last updated:** September 6, 2026  
**Live app:** https://brandexsheet.vercel.app/

---

## Stack (current)

| Layer | Technology |
|-------|------------|
| Monorepo | pnpm workspaces |
| Runtime | Node.js 20+, TypeScript ~5.9 |
| Frontend | React + Vite + TailwindCSS (`artifacts/tm-tracker`) |
| Primary DB | Supabase Postgres |
| Auth | Supabase Auth + RLS (`viewer` / `editor` / `admin`) |
| Storage | Supabase Storage (private logos, signed URLs) |
| Mirror | Google Sheets via Apps Script + Edge Function outbox |
| Deploy | Vercel (builds `artifacts/tm-tracker`) |

### Explicitly not in the active tree
- ~~Expo mobile app~~ — web-only for now (see Product decision below)
- ~~Express / Neon / Drizzle monolith~~ — replaced by Supabase client + SQL migrations
- ~~Direct Sheet writes from the browser~~ — disabled; mirror is secret-gated

---

## Product decision: mobile

**Status: web-only.**  
The earlier Expo path was removed from the active workspace. Mobile may be reconsidered later; until then all staff use the responsive web app at https://brandexsheet.vercel.app/.

---

## Architecture decisions

### Supabase is the source of truth
Staff create/update/delete only in the Datasheet UI. Changes land in Postgres, are audited, and are queued in `sheet_sync_outbox` for the Google Sheet mirror.

### Google Sheets is a mirror only
- `google-apps-script/Code.gs` exposes `mirrorExport`, `mirrorUpsert`, `mirrorDelete` behind `BRANDEX_MIRROR_SECRET`.
- Legacy create/update/delete from the browser return an error.
- Deletes move the row to `ARCHIVE` then remove it from `DATABASE`.

### One-time import
`scripts/import-google-sheet.mjs` (`pnpm import:sheet`) pulls via `mirrorExport` (or legacy `?action=list` fallback) and upserts into Supabase. Idempotent by record `id`.

### Edge Function sync
`supabase/functions/sync-google-sheet` processes pending/failed outbox rows (batch size 50) when invoked with `Authorization: Bearer <SHEET_SYNC_CRON_SECRET>`.

---

## Key commands

```bash
pnpm install --frozen-lockfile
cp .env.example .env
# set VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY

pnpm dev                 # Vite web app
pnpm typecheck
pnpm build
pnpm import:sheet        # one-time Sheet → Supabase (service-role + Apps Script secret)
```

Apply SQL migrations from `supabase/migrations/` in the Supabase SQL editor (or CLI).

---

## Environment variables

### Browser / Vercel (safe)
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

### Server / Edge / import only (never VITE_*)
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_APPS_SCRIPT_URL=...
GOOGLE_APPS_SCRIPT_SECRET=...   # same value as BRANDEX_MIRROR_SECRET in Apps Script
SHEET_SYNC_CRON_SECRET=...
```

---

## Where things live

```
artifacts/tm-tracker/           ← Web app (only frontend artifact)
supabase/migrations/            ← Schema + RLS
supabase/functions/sync-google-sheet/
google-apps-script/Code.gs      ← Mirror Web App
scripts/import-google-sheet.mjs ← One-time import
.env.example
```

---

## Common gotchas

- Never put service-role or Apps Script secrets in `VITE_*` vars or commit them.
- New Supabase users default to `viewer`; promote with SQL on `public.profiles`.
- Disable public sign-up; invite staff from the Supabase dashboard.
- Sheet tab names are looked up case-insensitively with legacy fallbacks (`Database`, `Audit Log`, etc.).
- Import closes related outbox jobs so the first mirror run does not re-push imported rows unnecessarily.
- `vercel.json` builds `@workspace/tm-tracker` and serves `artifacts/tm-tracker/dist`.

---

## Security checklist (ops)

See `SECURITY.md` for the full hardening checklist.
