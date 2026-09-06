# Brandex Project Guidelines

**Version 3.0.0**  
Engineering — September 2026

> **Note:**  
> Brandex Datasheet is a **Supabase-primary** trademark case-management system.  
> Google Sheets is an asynchronous operational mirror/backup only.  
> Staff must edit records in the Datasheet UI, not directly in the Sheet.

**Live app:** https://brandexsheet.vercel.app/

---

## Project Overview

Fast, secure trademark case-management Datasheet for Brandex Law Associates.

### Architecture

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite (`artifacts/tm-tracker`) on Vercel |
| Primary DB | Supabase Postgres |
| Auth | Supabase Auth + Row Level Security (viewer / editor / admin) |
| Files | Supabase Storage (private logos, signed URLs) |
| Mirror | Google Sheets via Apps Script + Edge Function outbox |
| Package manager | pnpm workspaces |

### Key Principles
- Browser never receives service-role keys or Apps Script secrets.
- Every record change is audited in Postgres and queued in `sheet_sync_outbox`.
- Sheet is **not** the source of truth.

---

## Workspace Structure (current)

```
Brandex/
├── artifacts/
│   └── tm-tracker/              # Web app (Vite + React)
├── google-apps-script/
│   └── Code.gs                  # Mirror-only Web App (secret-gated)
├── supabase/
│   ├── migrations/              # Schema + RLS
│   └── functions/
│       └── sync-google-sheet/   # Outbox processor
├── scripts/
│   └── import-google-sheet.mjs  # One-time Sheet → Supabase import
├── .env.example
├── README.md
├── Progress.md
└── AGENTS.md                    # This file
```

---

## Development Workflow

### Prerequisites
- Node.js 20+
- pnpm

### Setup
```bash
pnpm install --frozen-lockfile
cp .env.example .env
# Fill VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
pnpm dev
```

### Useful commands
```bash
pnpm typecheck
pnpm build
pnpm import:sheet          # one-time migration (needs service-role + Apps Script secret)
```

### Environment (browser-safe only on Vercel)
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Server-side / Edge Function secrets (never VITE_*):
- `GOOGLE_APPS_SCRIPT_URL`
- `GOOGLE_APPS_SCRIPT_SECRET` / `BRANDEX_MIRROR_SECRET`
- `SHEET_SYNC_CRON_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## CRITICAL: Backup and Git Workflow

**MANDATORY:** Commit and push after meaningful work.

```bash
git status
git add .
git commit -m "[Type] Brief description"
git push origin main
```

Commit types: `Add`, `Fix`, `Update`, `Refactor`, `Remove`, `Docs`

---

## Google Sheets Mirror

### Tabs (preferred names; lookup is case-insensitive + legacy fallbacks)
- `DATABASE` — 24-column operational mirror
- `LOGS` — audit-style log (legacy: Audit Log)
- `ARCHIVE` — soft-deleted rows
- Optional: `CLIENTS`, `TM5`…`TM56`, `JOURNAL`

### Apps Script API (hardened)
- `doGet` → service info only (writes disabled)
- `POST` actions (require `BRANDEX_MIRROR_SECRET`):
  - `mirrorExport` — full DB export for import
  - `mirrorUpsert` — create/update row by id
  - `mirrorDelete` — move to ARCHIVE then delete

Legacy create/update/delete from the browser are **disabled**.

---

## Security Guidelines

- Never commit `.env` or service-role keys.
- Never put `GOOGLE_APPS_SCRIPT_SECRET` or service-role keys in `VITE_*` variables.
- Disable public sign-up; invite staff via Supabase dashboard.
- Promote roles in SQL (`viewer` → `editor` / `admin`).
- Storage bucket is private; use short-lived signed URLs.

---

## Design Language

Neo-brutalist:
- Warm paper backgrounds (`#F0E8D0`)
- Black structural borders (`#0C0C0C`)
- Orange accents (`#C94A00`)
- Monospace bold typography
- Compact data-dense tables / print-friendly A4 layouts

---

## Project Contacts

- **Developer:** Nadeem (OutLawZ)
- **GitHub:** [@0utLawzz](https://github.com/0utLawzz)
- **Email:** net2outlawzz@gmail.com

---

## License

MIT — see LICENSE
