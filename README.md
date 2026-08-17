# Brandex

**A fast, clean trademark case-management system powered entirely by Google Sheets.**

No database server. No backend API. Just a Vite + React web app connected directly to your Google Sheet via a Google Apps Script Web App.

---

## Architecture

```
┌─────────────────────────────┐
│   Browser (tm-tracker)      │
│   React + Vite + TailwindCSS│
└────────────┬────────────────┘
             │ HTTPS fetch
             ▼
┌─────────────────────────────┐
│   Google Apps Script        │
│   (Code.gs — your backend)  │
└────────────┬────────────────┘
             │ Sheets API
             ▼
┌─────────────────────────────┐
│   Google Spreadsheet        │
│   Tab 1: Database           │
│   Tab 2: Audit Log          │
└─────────────────────────────┘
```

---

## Google Sheets Structure

Your Google Sheet must have exactly **two tabs**:

### Tab 1 — `Database` (or Sheet1)
Row 1 must contain these exact headers (order doesn't matter, names must match exactly):

| ID | DATE | TYPE | CLIENT CODE | CLIENT NAME | CASE NUMBER | APPLICATION NAME | STATUS | SUB STATUS | TM NUMBER | CLASS | CASE TYPE | CITY | NOTES | LAST MODIFIED |
|----|------|------|-------------|-------------|-------------|-----------------|--------|------------|-----------|-------|-----------|------|-------|---------------|

- **ID** — Auto-generated unique key (e.g. `BX-1234567890-42`)
- **TYPE** — TM, X, A, N, or C
- **STATUS** — STAGE 1 through STAGE 4
- **LAST MODIFIED** — ISO timestamp, auto-updated on every change

### Tab 2 — `Audit Log` (exact name required)
Row 1 must contain these exact headers:

| Timestamp | User | Action | Record | Field | Old Value | New Value |
|-----------|------|--------|--------|-------|-----------|-----------|

Every create, update, and delete operation is automatically logged here.

---

## Setup

### Prerequisites
- Node.js v18+
- pnpm

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Deploy Google Apps Script
1. Open your Google Sheet
2. Click **Extensions > Apps Script**
3. Paste the contents of `google-apps-script/Code.gs`
4. Click **Deploy > New Deployment > Web app**
   - Execute as: **Me**
   - Who has access: **Anyone with the link**
5. Copy the deployment URL

### 3. Configure Environment
```bash
copy .env.example .env
```

Edit `.env` and set:
```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
```

### 4. Run
```bash
pnpm --filter @workspace/tm-tracker run dev
```

Open `http://localhost:5173`

---

## Features

| Tab | Function |
|-----|----------|
| **DASHBOARD** | Stats overview, stage counts, recent activity |
| **SEARCH TM** | Instant full-text search across all fields |
| **DATABASE** | Full spreadsheet view with filters and pagination |
| **LOGS** | Complete audit trail with field-level change tracking |

---

## Design Language

Brandex uses a **neo-brutalist** visual system:
- Warm paper backgrounds (`#F0E8D0`)
- Black structural borders
- Orange accents (`#C94A00`)
- Bold monospace typography
- Compact data-dense tables

---

## Deployment

Since Brandex is a pure frontend app, you can deploy `artifacts/tm-tracker` to any static host:

```bash
pnpm --filter @workspace/tm-tracker run build
```

Deploy the `artifacts/tm-tracker/dist/` folder to:
- **Vercel** — `vercel --prod`
- **Netlify** — drag and drop the `dist/` folder
- **GitHub Pages** — push `dist/` to `gh-pages` branch

Set the `VITE_APPS_SCRIPT_URL` environment variable in your hosting provider's dashboard.

---

## Developer Info

- **Developer**: Nadeem (OutLawZ)
- **GitHub**: [@0utLawzz](https://github.com/0utLawzz)
- **Email**: net2outlawzz@gmail.com

---

## License

MIT
