# Authenticated Browser Smoke Test & Vercel Production Verification Checklist

Use this checklist to complete the remaining **Required release checks** listed in `Progress.md`.

Perform the browser tests while logged in with three different roles (viewer, editor, admin). Record pass/fail and any observations.

---

## 1. Preparation

- [x] Confirm production URL is reachable: https://brandexsheet.vercel.app (login/AuthGate rendered successfully)
- [ ] Have three test accounts ready (viewer, editor, admin) — blocked: credentials were not supplied
- [x] Browser console monitoring completed; no console errors were observed on the unauthenticated entry screen
- [ ] Access to the Vercel project dashboard (Project → Settings → Environment Variables) — project metadata was available, but environment-variable inventory was not exposed
- [ ] Access to the Supabase project dashboard (for role verification and outbox checks)

---

## 2. Viewer role

Status: **Blocked — no viewer credentials or authenticated session available.** No viewer result is marked PASS.

- [ ] Can log in successfully
- [ ] Can view the Dashboard (counts load without fetching full trademark payloads)
- [ ] Can open the Database list and see paginated records (50-row pages)
- [ ] Can use search and operational filters
- [ ] Can open a Record View and see the signed image (if present)
- [ ] Cannot create, edit, or delete records
- [ ] Cannot access any admin-only controls

---

## 3. Editor role

Status: **Blocked — no editor credentials or authenticated session available.** No editor result is marked PASS.

- [ ] Can log in successfully
- [ ] Can perform all viewer actions
- [ ] Can create a new trademark record
- [ ] Can edit an existing record
- [ ] Can upload or change a logo (private storage + short-lived signed URL)
- [ ] Changes appear in the list after refresh
- [ ] Cannot delete records

---

## 4. Admin role

Status: **Blocked — no admin credentials or authenticated session available.** No admin result is marked PASS.

- [ ] Can log in successfully
- [ ] Can perform all editor actions
- [ ] Can delete a single record
- [ ] Deleted record is removed from the Datasheet
- [ ] Corresponding outbox entry is created (check via Supabase Table Editor → `sheet_sync_outbox` or Edge Function logs)

---

## 5. Cross-cutting checks

- [ ] CSV export downloads only the currently filtered records
- [ ] A4 print / Record View renders correctly with brand colours
- [x] No browser console errors observed on the unauthenticated production entry screen
- [ ] Signed image URLs expire as expected (do not remain permanently public)
- [ ] Role changes in the `profiles` table take effect after re-login

---

## 6. Vercel Production Verification (Item 2)

Perform these checks in the Vercel dashboard for the production environment.

### 6.1 Environment Variables (Critical)

Status: **Not independently verified.** The available Vercel project metadata did not expose the environment-variable inventory. Do not treat the prior documentation claim as a fresh dashboard confirmation.

- [ ] Only the following two variables exist for Production (and Preview if used):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] No variable named `SUPABASE_SERVICE_ROLE_KEY` is present
- [ ] No variable named `GOOGLE_APPS_SCRIPT_URL`, `GOOGLE_APPS_SCRIPT_SECRET`, or `SHEET_SYNC_CRON_SECRET` is present
- [ ] No other secrets appear under any `VITE_*` prefix
- [ ] Values match the correct Supabase project (publishable key only)

### 6.2 Build & Deployment Settings

Status: **Partially verified from repository configuration.** `vercel.json` matches the documented build, install, framework, and output settings; dashboard override fields were not exposed by the available project metadata.

- [ ] Root directory is the repository root (not a sub-folder)
- [ ] Build command matches `vercel.json`: `pnpm --filter @workspace/tm-tracker run build`
- [ ] Output directory matches `vercel.json`: `artifacts/tm-tracker/dist`
- [ ] Framework preset is Vite (or left as detected)
- [ ] Install command uses pnpm (`pnpm install`)

### 6.3 Deployment Health

- [x] Latest Production deployment is READY and linked to the expected Git commit / branch (`main`); detailed build-log inspection was not exposed by the available project API
- [x] Deployment is linked to the expected Git commit / branch (main)
- [ ] No failed or cancelled deployments in the recent history that indicate secret or build problems — earlier recent ERROR deployments exist, although the current production deployment is READY
- [x] Production domain `brandexsheet.vercel.app` resolves and serves the application

### 6.4 Runtime Spot Checks (from browser)

- [x] Opening https://brandexsheet.vercel.app shows the login / AuthGate screen (no hard crash)
- [ ] After login, network requests go only to the Supabase project URL (no unexpected third-party calls carrying secrets)
- [x] Browser console contains no errors about missing environment variables on the unauthenticated entry screen
- [ ] Page source / network tab never reveals a service-role key

### 6.5 Post-verification actions

- [ ] If any forbidden secret was found in Vercel, rotate that secret immediately in Supabase / Apps Script and remove it from Vercel
- [ ] Record the deployment URL / commit hash that was verified
- [ ] Update `Progress.md` – mark “Vercel production verification” as complete and set the new “Last updated” date

---

## 7. Sign-off

Date: 12 September 2026
Tester: Codex automated verification
Result: **Partial / blocked** — public entry-point and code-side checks passed; authenticated role flows and dashboard secret inventory were not executable without credentials/dashboard access.

Verified Production deployment commit / URL:

`45c7c046dd7b65b4f7a02bcf8790d42c044e7921` / https://brandexsheet.vercel.app



Notes:

- Automated tests, typecheck, and production build passed.
- The unauthenticated production screen rendered successfully and showed no captured browser console errors.
- Viewer, editor, and admin smoke flows remain unchecked because no credentials were supplied; no PASS was inferred.
- The held phases (CSV import, related sheets, agent assignment timeline, and public search endpoint) were not started.



After completing the checklist, mark the corresponding items as done in `Progress.md` and update the “Last updated” date.
