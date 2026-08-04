# Brandex Trademark Tracker

Brandex is a live trademark registry for law and brand operations teams. It turns a Google Sheet into a searchable, stage-aware workspace that works from a desktop browser and a native mobile companion.

## What it does

- Keeps trademark records in a shared PostgreSQL-backed registry
- Syncs the live Google Sheet into the registry with one action
- Shows dashboard totals, workflow stages, substages, duplicates, and TM-11 counts
- Supports fast search by TM number, application name, and folder number
- Lets teams add, edit, and delete records with forward-only stage progression
- Records changes in an audit log
- Supports Google Sheets write-back through the Apps Script web app URL
- Provides the same core flows in the desktop web app and Expo mobile app

## Workspace

| Artifact | Purpose | Preview |
| --- | --- | --- |
| `artifacts/tm-tracker` | Desktop web command center | `/` |
| `artifacts/tm-tracker-mobile` | Native mobile companion | `/mobile/` |
| `artifacts/api-server` | Shared Express API | `/api` |

Shared API contracts and generated clients live under `lib/`. The desktop and mobile apps use the same API and database, so updates made in either experience are visible in the other.

## Google Sheets setup

The API uses these Replit Secrets:

- `GOOGLE_SHEETS_API_KEY` — reads the configured sheet through the Google Sheets API
- `GOOGLE_SHEETS_APPS_SCRIPT_URL` — sends trademark updates and audit entries back to the sheet
- `DATABASE_URL` / `DATABASE_URL_UNPOOLED` — database connectivity and schema tooling

The sheet sync expects columns in this order: `DATE`, `CASE NO`, `APP NAME`, `TM NO`, `CLASS`, `STATUS`, `SUB STATUS`, `Duplicate`, `TM-11`, `Notes`, `City`.

## Run locally in Replit

The project uses pnpm workspaces and Replit artifact workflows:

```bash
pnpm install
```

Start the configured workflows from Replit. The API serves `/api`, the desktop app serves `/`, and Expo serves `/mobile/`.

Useful checks:

```bash
pnpm run typecheck:libs
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/tm-tracker-mobile run typecheck
```

## Design language

Brandex uses a neo-brutalist visual system: warm paper backgrounds, black structural borders, orange accents, bold typography, compact data cards, and direct operational labels.

## Project

Built by Nadeem (OutLawZ), Custom Automation Specialist.

- GitHub: [0utLawzz](https://github.com/0utLawzz)
- Email: [net2outlawzz@gmail.com](mailto:net2outlawzz@gmail.com)

License: MIT
