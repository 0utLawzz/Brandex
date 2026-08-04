# Brandex TM Tracker — In Progress

## Current work — August 04, 2026

- Bringing the mobile artifact live alongside the desktop tracker.
- Wiring Google Sheets sync with the configured API key and Apps Script URL.
- Keeping mobile and desktop on the same API/database source of truth.
- Preparing a pitch deck covering both app experiences.
- Rewriting the README and pushing the completed update to GitHub.

## Completed in this pass

- Mobile workflow is live on Expo/Metro at `/mobile/`.
- Desktop and mobile share the same API, database, Google Sheets import, and Apps Script write-back path.
- Google Sheets import uses `GOOGLE_SHEETS_API_KEY`, handles blank substages, and reports synced/skipped rows.
- Created and validated the 8-slide Brandex desktop/mobile pitch deck.
- Rewrote `README.md` with setup, architecture, secrets, and workflow documentation.
- Final smoke checks passed: API health is OK and live registry data is available.

## Completed in this pass

- Mobile opens on **Search by TM No**.
- Dashboard city breakdown removed.
- Blank TM numbers, statuses, substages, and cities are excluded from aggregate counts.
- Database results sort by the sheet date, latest first.
- Mobile trademark cards show:
  - `ADD TM#` at the top
  - name
  - color-filled stage with light text
  - date
  - `FOLDER / CASE NO`
  - `SUB STAGE`
  - green/gray traffic lights for Duplicate and TM-11 (`true` = ON, `false` = OFF)

## Still required to finish sheet write-back

The published CSV URL is read-only. To write changes back, deploy the Apps
Script in `google-apps-script/Code.gs` as a Web App and add its `/exec` URL as
the Replit secret:

`GOOGLE_SHEETS_APPS_SCRIPT_URL`

After that URL is configured, the API update route will forward saved
trademark changes and an audit entry to the same spreadsheet.