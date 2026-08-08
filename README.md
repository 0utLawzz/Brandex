# Brandex Trademark Tracker

Brandex is a live trademark registry for law and brand operations teams. It turns a Google Sheet into a searchable, stage-aware workspace — available as a **native mobile app** (Expo) and a **desktop web app** (React/Vite), both backed by the same PostgreSQL database on Neon.

## What It Does

- Keeps trademark records in a shared Neon PostgreSQL database
- Syncs the live Google Sheet into the registry with one tap
- Dashboard showing totals, workflow stages, sub-stages, duplicates, and TM-11 counts
- Fast search by TM number, application name, and folder number
- Add, edit, and delete records with forward-only stage progression
- Records all changes in an audit log
- Supports Google Sheets write-back through an Apps Script web app
- Same core flows on mobile (Expo) and desktop (Vite)

---

## Workspace Structure

| Artifact | Purpose | Deploy target |
|----------|---------|--------------|
| `artifacts/tm-tracker-mobile` | **Primary** — Expo mobile + web | Expo Go / EAS Build |
| `artifacts/tm-tracker` | Desktop web copy | Vercel |
| `artifacts/api-server` | Shared Express API | Vercel Serverless / Node |
| `lib/db` | Drizzle ORM schema + migrations | — |
| `lib/api-spec` | OpenAPI spec (source of truth) | — |
| `lib/api-client-react` | Generated React Query hooks | — |
| `lib/api-zod` | Generated Zod schemas | — |

---

## Local Development (Windows)

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Git

### Setup

```bash
# 1. Install all dependencies
pnpm install

# 2. Copy and fill in your environment variables
copy .env.example .env
# Edit .env: set DATABASE_URL, GOOGLE_SHEETS_API_KEY, etc.
```

### Running Locally (3 terminals)

```bash
# Terminal 1 — API server (http://localhost:8080)
PORT=8080 pnpm --filter @workspace/api-server run dev

# Terminal 2 — Web app (http://localhost:5173)
pnpm --filter @workspace/tm-tracker run dev

# Terminal 3 — Mobile app (Expo DevTools)
pnpm --filter @workspace/tm-tracker-mobile run dev
```

> **Tip:** The web app auto-proxies `/api` to `localhost:8080`. The mobile app uses `EXPO_PUBLIC_DOMAIN` from `.env` to find the API.

### Database Schema Push (dev only)

```bash
pnpm --filter @workspace/db run push
```

### Type Checking

```bash
# Check all shared libraries
pnpm run typecheck:libs

# Check mobile app
pnpm --filter @workspace/tm-tracker-mobile run typecheck
```

### Regenerate API Client (after OpenAPI spec changes)

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Environment Variables

See [`.env.example`](.env.example) for the full list with descriptions.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `DATABASE_URL_UNPOOLED` | Optional | Direct connection for migrations |
| `GOOGLE_SHEETS_API_KEY` | ✅ | For "Sync G-Sheets" feature |
| `GOOGLE_SHEETS_APPS_SCRIPT_URL` | Optional | Enables write-back to Google Sheets |
| `SESSION_SECRET` | ✅ | Random secret for session management |
| `EXPO_PUBLIC_DOMAIN` | Mobile | API domain for the Expo app (e.g. `localhost:8080`) |
| `PORT` | Optional | API server port (default: `8080`) |

---

## Google Sheets Setup

The sync expects columns in this order:
`DATE` | `CASE NO` | `APP NAME` | `TM NO` | `CLASS` | `STATUS` | `SUB STATUS` | `Duplicate` | `TM-11` | `Notes` | `City`

For write-back (optional):
1. Open your Google Sheet → Extensions → Apps Script
2. Paste the code from `google-apps-script/Code.gs`
3. Deploy as Web App (Execute as: Me, Access: Anyone with link)
4. Copy the `/exec` URL → add as `GOOGLE_SHEETS_APPS_SCRIPT_URL` in `.env`

---

## Deploying to Vercel

```bash
# Login and link project
vercel login
vercel

# Set environment variables in Vercel dashboard:
# DATABASE_URL, GOOGLE_SHEETS_API_KEY, SESSION_SECRET
# (GOOGLE_SHEETS_APPS_SCRIPT_URL if using write-back)

# Deploy to production
vercel --prod
```

> **SSL Note:** Neon requires SSL. Ensure `DATABASE_URL` ends with `?sslmode=require`.

---

## Design Language

Brandex uses a **neo-brutalist** visual system:
- Warm paper backgrounds (`#F0E8D0`)
- Black structural borders
- Orange accent color
- Bold uppercase typography (Space Grotesk)
- Compact data cards with hard shadows

---

## Project

Built by Nadeem (OutLawZ), Custom Automation Specialist.

- GitHub: [0utLawzz](https://github.com/0utLawzz)
- Email: [net2outlawzz@gmail.com](mailto:net2outlawzz@gmail.com)

License: MIT
