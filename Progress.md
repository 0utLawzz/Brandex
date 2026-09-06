# Brandex TM Tracker — Progress Report

**Last Updated:** September 6, 2026  
**Project Status:** 🟢 Production-ready core / Active hardening

**Live URL:** https://brandexsheet.vercel.app/

---

## Architecture (Current)

- **Primary source of truth:** Supabase Postgres + Auth (RLS) + Storage
- **Operational mirror / backup:** Google Sheets via secure Apps Script mirror
- **Frontend:** React + Vite (`artifacts/tm-tracker`) on Vercel
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

### Docs & repo hygiene (this refresh)
- Progress.md brought current (this file)
- AGENTS.md rewritten to match Supabase-primary architecture (pending in same batch)

---

## 🟡 IN PROGRESS / PENDING

1. **Google Sheet mirror fully operational in production**
   - Deploy latest `google-apps-script/Code.gs` as Web App
   - Set Script Property `BRANDEX_MIRROR_SECRET`
   - Configure Edge Function secrets + cron invocation
   - End-to-end test: create/update/delete in Datasheet → outbox → Sheet

2. **Repo metadata**
   - Homepage → `https://brandexsheet.vercel.app/`
   - Description + topics cleanup (typo `databsae` → `database`)

3. **Documentation consistency**
   - Keep AGENTS.md / README / Progress.md aligned after every architecture change

---

## 📋 SUGGESTED NEXT STEPS

### Immediate
1. Deploy + secret-configure Apps Script + Edge Function
2. Run one full mirror cycle and verify ARCHIVE + LOGS
3. Update GitHub repo homepage / description / topics
4. Smoke-test production at https://brandexsheet.vercel.app/

### Short-term
5. Automated tests (unit + critical path integration)
6. Rate limiting / stronger API hardening if any public endpoints remain
7. Mobile path decision (re-enable Expo or keep web-only)

---

## 🔍 VERIFICATION CHECKLIST

- [x] Supabase is primary DB
- [x] Apps Script legacy writes disabled; only mirror actions with secret
- [x] Import script supports both modern `mirrorExport` and legacy list fallback
- [ ] Production mirror cron running and healthy
- [ ] Repo homepage points to brandexsheet.vercel.app
- [ ] Progress.md / AGENTS.md match live architecture

---

## 📝 WORK LOG

### September 6, 2026
- Reviewed Code.gs, import script, migrations, README, AGENTS.md, Progress.md
- Identified docs drift (AGENTS still described pure-Sheets era)
- Refreshed Progress.md to current Supabase-primary state

### August 29, 2026
- Fix: Allow duplicate legacy case references
- Fix: Support legacy Sheet export during migration
- Fix: Make Sheet importer resolve Supabase client

### August 18, 2026
- Branding, logo, print styling, A4 layout, notes boxes
- Performance, status workflow, constraints, image upload, date formatting
- Case-insensitive sheet name lookup + legacy fallbacks

### August 5, 2026 (historical)
- GitHub community standards, early mobile/desktop notes (later architecture evolved to Supabase primary)

---

**Next Review Date:** September 13, 2026  
**Maintained by:** Nadeem (OutLawZ) — [@0utLawzz](https://github.com/0utLawzz)
