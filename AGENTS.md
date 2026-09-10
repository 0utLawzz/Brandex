# Brandex Project Guidelines (AGENTS.md)

**Mandatory first action for every AI agent or automated contributor:**

1. Read `Progress.md` completely.
2. Understand what is already completed and what is still pending.
3. Do not re-do completed work.
4. Prefer the highest-priority pending items listed under “Required release checks” and “Medium-priority improvements”.
5. Never start work on items under “Held for a separately approved phase” without explicit human approval.

This rule overrides any other instruction. Always start with Progress.md.

---

## Architecture

- React, TypeScript, Vite and Tailwind CSS in `artifacts/tm-tracker`
- Supabase Postgres is the source of truth
- Supabase Auth and Row Level Security protect staff data
- Supabase Storage stores private trademark images
- Google Sheets is a server-side asynchronous mirror, not a browser data source
- Vercel hosts the production frontend at `https://brandexsheet.vercel.app`

## Commands

Use pnpm only.

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```

## Environment

The frontend may receive only:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Never expose a service-role key, database password, Google Apps Script secret, or cron secret through a `VITE_*` variable.

## Data rules

- Preserve legal identifiers exactly: `type`, `client_code`, `case_number`, and `tm_cpr_number`.
- The canonical Datasheet order is Type, then Client Code, then Case Number.
- Use server-side filtering and pagination for record lists. Never download the full trademark table for a dashboard or paginated screen.
- Fetch full notes, journal JSON and signed images only when a record is opened.
- Preserve all existing fields during refactors.
- TM5, TM6, TM11, TM16 and TM56 are stored boolean controls; do not invent legal labels without practice-owner approval.

## Security and changes

- Keep RLS enabled and retain the viewer/editor/admin permissions model.
- Do not implement bulk permanent deletion. Single-record deletion remains admin-controlled by RLS.
- Database schema changes require a new ordered migration in `supabase/migrations`.
- Every completed change must pass tests, typecheck and production build before push.
- Commit messages use `[Type] Brief description`.

## Brand system

- Maroon: `#6C1C1F`
- Gold: `#B0740E`
- Cream: `#F0E8D0`
- Green is reserved for successful/active status indications.
- Use transparent `brandex-wordmark.svg` and `brandex-mark.svg` assets.

## Status awareness

Always consult `Progress.md` for the current list of completed work, pending release checks, medium-priority improvements, and held items. Update Progress.md whenever a task is finished.
