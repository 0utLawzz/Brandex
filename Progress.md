# Brandex Datasheet Progress

**Last updated: 12 September 2026 (Admin CSV import + registry work already on remote; automated verification + Edge Function observability completed)**

This file is the single source of truth for project status.  
**Any AI agent or contributor must read this file first** before making changes, suggesting work, or starting a new task.

---

## Production foundation (Complete)

- [x] React/Vite web application (`artifacts/tm-tracker`)
- [x] Supabase Postgres primary database
- [x] Supabase staff authentication and RLS (viewer / editor / admin)
- [x] Private Storage for trademark images (signed URLs)
- [x] Audit log and asynchronous Google Sheet outbox
- [x] One-time import of 1,671 Sheet records
- [x] Vercel production deployment (https://brandexsheet.vercel.app)
- [x] Restored PR #1 optimized production baseline

## Phase 1 (Complete)

- [x] Transparent lightweight Brandex wordmark and compact mark
- [x] Maroon, gold and cream brand system
- [x] Compact verified contact footer
- [x] Canonical Type / Client Code / Case Number ordering
- [x] Server-side 50-record pagination
- [x] Universal search and operational filters
- [x] TM5, TM6, TM11, TM16 and TM56 controls
- [x] Count-only dashboard metrics
- [x] Filtered CSV export
- [x] Full Record View with prominent uploaded image
- [x] Branded A4 print record with manual notes
- [x] Supabase / Vercel setup and security documentation

## Documentation consistency (Completed 10 September 2026)

- [x] CONTRIBUTING.md rewritten to match current web-only architecture
- [x] Clone URLs corrected in README.md and INSTALL.md (now Brandex-Database-CMS)
- [x] Project structure, commands, and security rules aligned with AGENTS.md and DEV_NOTES.md

## Reliability fixes (Completed 10 September 2026)

- [x] Sheet sync outbox: reclaim stale `processing` rows + `MAX_ATTEMPTS=10` dead-letter
- [x] Optimistic concurrency: `version` column + `ConflictError` in `updateTrademark`
- [x] RecordModal passes `expectedVersion` and surfaces conflict toast to the editor

## UI layout pass (Completed 11–12 September 2026)

- [x] **Add Record**: removed Client Name field; regrouped DATE/TYPE/CLIENT CODE/CASE NO → Case Info (Case Type, App Name, Class, TM No) → Stage/Sub-stage → Agent + Agent City → Notes & Image
- [x] **Dashboard**: Filter by Agent + Class boxes; Recent Activity shows 10 entries
- [x] **Assigned**: only Stage 2 + Sub-status Assigned
- [x] **Database**: column order DATE / MODIFIED / TYPE / CLIENT CODE / CASE NO / TM/CPR / CLASS / APPLICATION / STATUS / SUB-STATUS / CLIENT / CITY / TM FORMS / JOURNAL; default sort by filing date newest first; IMPORT button (admin)
- [x] **Audit Logs**: user shown short (not full UUID); old/new values summarized (not full JSON blobs)
- [x] **api.ts**: `listTrademarkPage` sorts by `filing_date` desc, then `updated_at` desc
- [x] **RecordModal.tsx**: restored full regrouped form + AGENT CITY + ConflictError handling
- [x] **Search result cards**: thumbnail, large application name, Class, TM No, Type on right, Case/Client below, large Stage / small Sub-stage
- [x] **Record View**: image priority, Application Details emphasis, Status + Sub-status, Agent/City prominence, Stage 1–4 payment tick+date boxes under Office Notes, “CEO BRANDEX SIGNATURE/STAMP”
- [x] **Print Record A4**: `id=record-view-body`, `print:hidden` chrome, `print-avoid-break` sections, compact print spacing, print header/footer, richer journal print block

## Admin CSV import + registry tables (Completed 12 September 2026)

- [x] Migration `202609120001_form_journal_registry.sql` — `form_registry` + `journal_registry` with RLS (staff read / admin write)
- [x] `registryImport.ts` — parseFormCsv / parseJournalCsv, normalizeTmNumber, dryRun + commit (dedupe by TM+type+date)
- [x] `RegistryImportModal.tsx` — kind toggle (Form / Journal), Choose CSV → Dry-run preview → Commit inserts
- [x] Database page IMPORT button: admin-only opens modal; non-admin sees disabled/alert

**Still needed for full matching pipeline**

- [ ] Apply migration on Supabase production
- [ ] Match engine: on import/save, set trademarks.tm5…tm56 from form_registry; populate journal_number / journal_date / journal_data from journal_registry
- [ ] Green/grey TM form badges driven by registry match (already UI-ready via tmMatches)

## Required release checks

- [x] Automated tests
- [x] TypeScript typecheck
- [x] Production build
- [ ] Authenticated browser smoke test (viewer / editor / admin flows) → see SMOKE_TEST_CHECKLIST.md
- [ ] Vercel production verification (deployment and runtime entry point verified; dashboard environment-variable inventory not exposed in the available project API) → see SMOKE_TEST_CHECKLIST.md

## Medium-priority improvements

- [ ] Expand unit and integration tests around the outbox processor and role gates (API boundary coverage expanded; Edge Function/RLS integration coverage still pending)
- [x] Add structured logging / observability to the Edge Function (`supabase/functions/sync-google-sheet`)
- [x] Document backup and restore procedures for the private storage bucket (`trademark-files`) → see STORAGE_BACKUP.md

## Additional recommendations (Pending – evaluate before implementing)

- [ ] Soft-delete / archive table inside Supabase (if legal retention of deleted records is required)
- [ ] Foreign-key or documented validation between `trademarks.client_code` and `clients.code`
- [ ] Simple health-check or status view for the sync outbox
- [ ] Rate-limiting / monitoring on Auth endpoints (low priority while staff-only)
- [ ] Persist Stage 1–4 payment ticks + dates as structured fields (currently UI-only pending schema approval)

## Held for a separately approved phase

- [ ] Registry → trademark match-on-save / batch apply
- [ ] Agent assignment timeline and workflow flags
- [ ] Public trademark search endpoint

---

## How to use this file

1. Read this file completely before any work.
2. Update the checkboxes and “Last updated” date when a task is finished.
3. Keep the “Pending” sections accurate so the next agent or developer knows the exact state.
4. Do not start work on items marked “Held for a separately approved phase” without explicit approval.

## Verification run (12 September 2026)

- [x] `pnpm test` → 1 file, 8 tests passed
- [x] `pnpm typecheck` → passed
- [x] `pnpm build` → passed; Vite production bundle generated successfully
- [x] Production URL reachable → login/AuthGate rendered at https://brandexsheet.vercel.app with no browser console errors observed
- [x] Latest Vercel production deployment → READY on `main`, commit `45c7c046dd7b65b4f7a02bcf8790d42c044e7921`
- [ ] Authenticated viewer/editor/admin flows → blocked because no test credentials were supplied and no authenticated browser session was available
- [ ] Supabase/Vercel dashboard secret inventory → not independently confirmed through the available project APIs; no local `.env` file was present in the checkout

## Current active focus

1. Run migration `202609120001_form_journal_registry.sql` on Supabase.
2. Admin dry-run + commit CSV into form_registry / journal_registry from Database → IMPORT.
3. Next: match engine to light TM flags + journal_data on trademarks.

## 2026-09-12 — Admin CSV import (dry-run)

- [x] form_registry + journal_registry tables + RLS
- [x] registryImport.ts (parse / dry-run / commit)
- [x] RegistryImportModal + Database IMPORT (admin)
