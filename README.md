# Brandex

Fast, secure trademark case-management Datasheet for Brandex Law Associates.

## Architecture

- **React + Vite** frontend on Vercel
- **Supabase Postgres** as the primary record database
- **Supabase Auth + Row Level Security** for staff access
- **Supabase Storage** for private trademark logos and files
- **Google Sheets** as an asynchronous operational mirror/backup

The browser never receives a database service key or Google Apps Script secret. Every record change is audited in Postgres and placed in a retryable Sheet sync outbox.

## Local setup

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

Set these browser-safe values in `.env`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/202608280001_brandex_datasheet.sql` in the SQL editor, or apply it with the Supabase CLI.
3. Create staff users in **Authentication > Users**. New users receive the `viewer` role.
4. Promote approved users in the SQL editor:

```sql
update public.profiles
set role = 'admin'
where user_id = (select id from auth.users where email = 'owner@example.com');
```

Use `editor` for staff who may add and update records, `viewer` for read-only access, and `admin` for deletion and user administration. Disable public sign-ups; create or invite staff from the Supabase dashboard.

## One-time Google Sheet import

Deploy the latest `google-apps-script/Code.gs`, then set the Apps Script property `BRANDEX_MIRROR_SECRET` to a long random value. Set these values only in the terminal session running the import:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
GOOGLE_APPS_SCRIPT_SECRET=THE_SAME_MIRROR_SECRET
```

Run `pnpm import:sheet`. The importer is idempotent by record ID. Do not expose the service-role key in Vercel browser variables or commit it to git.

## Automatic Sheet mirror

Deploy `supabase/functions/sync-google-sheet` and configure these Edge Function secrets:

- `GOOGLE_APPS_SCRIPT_URL`
- `GOOGLE_APPS_SCRIPT_SECRET`
- `SHEET_SYNC_CRON_SECRET`

Invoke the function on a schedule with `Authorization: Bearer <SHEET_SYNC_CRON_SECRET>`. It processes up to 50 pending/failed outbox items per run and retries failed Sheet writes on the next run.

## Verification

```bash
pnpm typecheck
pnpm build
```

## Vercel deployment

Configure only these frontend variables for Preview and Production:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Then deploy from the repository root. `vercel.json` builds `artifacts/tm-tracker` and serves its `dist` directory.

## Security notes

- Postgres RLS requires an authenticated staff account.
- The storage bucket is private and images use short-lived signed URLs.
- Google Apps Script legacy reads/writes are disabled; only secret-authenticated mirror operations remain.
- Deleted records move from the Sheet `DATABASE` tab to `ARCHIVE` instead of being discarded.
- The Sheet is a mirror, not the source of truth. Staff edits must be made in Brandex Datasheet.

## License

MIT
