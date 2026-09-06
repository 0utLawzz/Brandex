# Brandex TM Tracker — Progress Report

**Last Updated:** September 6, 2026  
**Project Status:** 🟢 Production-ready core / Active hardening

**Live URL:** https://brandexsheet.vercel.app/

---

## Architecture (Current)

- **Primary source of truth:** Supabase Postgres + Auth (RLS) + Storage
- **Operational mirror / backup:** Google Sheets via secure Apps Script mirror
- **Frontend:** React + Vite (`artifacts/tm-tracker`) on Vercel — **web-only** (no active Expo app)
- **Sync:** Outbox table + Edge Function `sync-google-sheet` + Apps Script `mirrorUpsert` / `mirrorDelete` / `mirrorExport`
- **Legacy direct Sheet writes:** Disabled in `Code.gs` (security)

---

## ✅ COMPLETED (through Sep 2026)

### Core platform
- Supabase schema + migrations (`202608280001_brandex_datasheet.sql`, `202608280002_allow_duplicate_case_references.sql`)
- RLS roles: viewer / editor / admin
- Private logo storage + signed URLs
- One-time Sheet → Supabase importer (`pnpm import:sheet` / `scripts/import-google-sheet.mjs`)
- Hardened Google Apps Script v2 (mirror-only, secret-gated)
- Case-insensitive sheet name lookup + ARCHIVE tab on delete
- Branding, official logo, dark-blue print styling, compact A4 layout, notes boxes
- Performance, status workflow, city/type constraints, image upload, date formatting
- Duplicate legacy case references allowed (migration)
- Sheet importer resolves Supabase client correctly

### Docs & repo hygiene (6 Sep 2026)
- Progress.md, AGENTS.md, README.md refreshed for Supabase-primary
- DEV_NOTES.md rewritten (removed Neon/Express/mobile era)
- INSTALL.md rewritten for Supabase + Vercel
- SECURITY.md updated with production hardening checklist
- Product decision recorded: **web-only** until mobile is deliberately reintroduced

---

## 🟡 IN PROGRESS / PENDING

1. **Google Sheet mirror fully operational in production** (ops — not docs)
   - Deploy latest `Code.gs`, set `BRANDEX_MIRROR_SECRET`
   - Edge Function secrets + cron
   - E2E: UI → outbox → Sheet + ARCHIVE

2. **Repo metadata on GitHub** (manual UI — connector has no update-repo tool)
   - Homepage → `https://brandexsheet.vercel.app/`
   - Description → e.g. `Brandex Datasheet — Supabase-primary trademark case management with Google Sheets mirror`
   - Topics → `supabase`, `trademark`, `datasheet`, `google-sheets`, `vercel`, `typescript`, `react` (remove typo `databsae`)

---

## 📋 SUGGESTED NEXT STEPS

1. Complete production mirror deploy + one full sync cycle
2. Apply GitHub repo homepage / description / topics (see steps below)
3. Run through SECURITY.md hardening checklist on production
4. Optional later: automated tests; reconsider mobile only if product requires it

### GitHub metadata (do in browser)
1. Open https://github.com/0utLawzz/Brandex
2. Click the gear next to **About**
3. **Website:** `https://brandexsheet.vercel.app/`
4. **Description:** `Brandex Datasheet — Supabase-primary trademark case management with Google Sheets mirror`
5. **Topics:** add `supabase`, `trademark`, `datasheet`, `google-sheets`, `vercel`, `typescript`, `react` — remove `databsae`, `excel` if desired
6. Save

---

## 🔍 VERIFICATION CHECKLIST

- [x] Supabase is primary DB
- [x] Apps Script legacy writes disabled; only mirror actions with secret
- [x] Import script supports both modern `mirrorExport` and legacy list fallback
- [x] Docs aligned: Progress / AGENTS / README / DEV_NOTES / INSTALL / SECURITY
- [x] Mobile path closed as web-only for now
- [ ] Production mirror cron running and healthy
- [ ] Repo homepage/topics updated on GitHub About panel
- [ ] SECURITY hardening checklist completed on production

---

## 📝 WORK LOG

### September 6, 2026
- Reviewed Code.gs, import script, migrations, docs
- Pushed docs refresh: Progress, AGENTS, README, DEV_NOTES, INSTALL, SECURITY
- Approved recommendations applied: docs + mobile decision + security checklist
- Repo metadata left as manual GitHub UI step (no connector API)

### August 29, 2026
- Fix: Allow duplicate legacy case references
- Fix: Support legacy Sheet export during migration
- Fix: Make Sheet importer resolve Supabase client

### August 18, 2026
- Branding, logo, print styling, A4 layout, notes boxes
- Performance, status workflow, constraints, image upload, date formatting
- Case-insensitive sheet name lookup + legacy fallbacks

---

**Next Review Date:** September 13, 2026  
**Maintained by:** Nadeem (OutLawZ) — [@0utLawzz](https://github.com/0utLawzz)
