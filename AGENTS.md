# Brandex Project Guidelines

**Version 2.0.0**  
Engineering  
August 2026

> **Note:**  
> This document provides project-level guidelines for the Brandex trademark tracker. Brandex is now a pure Google Sheets-backed application. There is no database server or backend API.

---

## Project Overview

Brandex is a live trademark registry for law and brand operations teams. It is a single React web application (`artifacts/tm-tracker`) that communicates directly with a **Google Apps Script Web App**, which in turn reads and writes to a **Google Spreadsheet**.

### Key Technologies
- **Frontend**: React (Vite + TailwindCSS)
- **Backend**: Google Apps Script (`google-apps-script/Code.gs`)
- **Database**: Google Sheets (two tabs: `Database` and `Audit Log`)
- **Package Manager**: pnpm

### No Longer Used
- ~~PostgreSQL / Neon~~ — removed
- ~~Express API server~~ — removed (`artifacts/api-server` deleted)
- ~~Expo mobile app~~ — removed (`artifacts/tm-tracker-mobile` deleted)
- ~~`@workspace/db`, `@workspace/api-spec`, `@workspace/api-client-react`~~ — deleted

---

## Workspace Structure

```
Brandex/
├── artifacts/
│   └── tm-tracker/            # The only artifact — the web app
│       └── src/
│           ├── lib/api.ts     # Google Apps Script API client
│           ├── pages/         # Dashboard, Search, Database, Logs
│           └── components/    # RecordModal, Navbar, AppShell
├── google-apps-script/
│   └── Code.gs                # The full backend (deploy to GAS)
├── .env                       # Only needs VITE_APPS_SCRIPT_URL
└── .env.example               # Template
```

---

## Development Workflow

### Prerequisites
- Node.js (v18 or higher)
- pnpm package manager

### Setup Commands
```bash
# Install dependencies
pnpm install

# Run the web app
pnpm --filter @workspace/tm-tracker run dev

# Type check
pnpm --filter @workspace/tm-tracker run typecheck

# Build for production
pnpm --filter @workspace/tm-tracker run build
```

### Environment Variables
Only one variable is required:

```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

---

## **CRITICAL: Backup and Git Workflow**

### Automatic Commit and Push Policy

**MANDATORY PRACTICE**: Always commit and push code to GitHub immediately after completing any work.

```bash
# 1. Check current status
git status

# 2. Stage all changes
git add .

# 3. Commit with descriptive message
git commit -m "Your commit message here"

# 4. Push to remote immediately
git push origin main
```

### Commit Message Guidelines
- Format: `[Type] Brief description`
- Types: `Add`, `Fix`, `Update`, `Refactor`, `Remove`, `Docs`

---

## Google Sheets Structure

### Tab 1 — `Database`
Headers in row 1 (exact names required):
`ID`, `DATE`, `TYPE`, `CLIENT CODE`, `CLIENT NAME`, `CASE NUMBER`, `APPLICATION NAME`, `STATUS`, `SUB STATUS`, `TM NUMBER`, `CLASS`, `CASE TYPE`, `CITY`, `NOTES`, `LAST MODIFIED`

### Tab 2 — `Audit Log`
Headers in row 1:
`Timestamp`, `User`, `Action`, `Record`, `Field`, `Old Value`, `New Value`

---

## Security Guidelines

### Never Commit Secrets
- Do not commit the actual `VITE_APPS_SCRIPT_URL` with a deployed URL unless it's intentional (Apps Script URLs are public by design when "Anyone with the link" is set).
- Ensure your Google Sheet access is appropriately restricted.

---

## Code Style and Conventions

### Design Language
Brandex uses a neo-brutalist visual system:
- Warm paper backgrounds (`#F0E8D0`)
- Black structural borders (`#0C0C0C`)
- Orange accents (`#C94A00`)
- Monospace bold typography
- Compact data-dense tables

### TypeScript Guidelines
- Use TypeScript for all new code
- All types are defined in `src/lib/api.ts`
- Avoid `any` types

---

## API Architecture (Google Apps Script)

The `Code.gs` file acts as a REST-like API:

| Method | Action | Description |
|--------|--------|-------------|
| `GET` | `?action=list` | Returns all database rows as JSON |
| `GET` | `?action=stats` | Returns statistics (totals, by stage, by city) |
| `GET` | `?action=listLogs&limit=N&offset=N` | Returns audit log entries |
| `POST` | `{ action: "create", record: {...} }` | Creates a new row |
| `POST` | `{ action: "update", id: "...", record: {...} }` | Updates a row by ID |
| `POST` | `{ action: "delete", id: "..." }` | Deletes a row by ID |

All create/update/delete operations automatically log to the `Audit Log` sheet.

---

## Project Contacts

- **Developer**: Nadeem (OutLawZ)
- **GitHub**: [@0utLawzz](https://github.com/0utLawzz)
- **Email**: net2outlawzz@gmail.com

---

## License

MIT License — See LICENSE file for details.
