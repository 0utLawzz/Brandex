# Brandex Datasheet Installation

## Requirements

- Node.js 20 or later
- pnpm
- A Supabase project
- Optional: Vercel CLI and Supabase CLI for deployment administration

## Local application

```bash
git clone https://github.com/0utLawzz/Brandex.git
cd Brandex
pnpm install --frozen-lockfile
```

Copy `.env.example` to `.env` and enter the browser-safe Supabase values:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Start and verify:

```bash
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```

## Supabase setup

Apply migrations in filename order from `supabase/migrations`. The first migration creates staff profiles, clients, trademark records, audit logs, the private files bucket policies, RLS and the Sheet-sync outbox.

Create staff accounts in Supabase Authentication. Promote an approved user with the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where user_id = (select id from auth.users where email = 'owner@example.com');
```

Use `viewer` for read-only staff, `editor` for create/update access and `admin` for deletion and administration.

## One-time Sheet import

The completed production import contains 1,671 records. To repeat an import in another environment, keep these server secrets only in the terminal session running the importer:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
GOOGLE_APPS_SCRIPT_SECRET=YOUR_MIRROR_SECRET
```

Run:

```bash
pnpm import:sheet
```

The importer upserts by record ID and supports the legacy read-only export only for migration. Supabase remains the primary datastore.

## Google Sheet mirror

Deploy `supabase/functions/sync-google-sheet` and configure its server-side secrets:

- `GOOGLE_APPS_SCRIPT_URL`
- `GOOGLE_APPS_SCRIPT_SECRET`
- `SHEET_SYNC_CRON_SECRET`

Never add these values to Vercel as `VITE_*` variables.

## Vercel

Set the two frontend Supabase variables for Production and Preview. Deploy from the repository root; `vercel.json` builds the tracker and publishes its `dist` directory.

Production URL: `https://brandexsheet.vercel.app`
