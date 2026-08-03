# Brandex TM Tracker — In Progress

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