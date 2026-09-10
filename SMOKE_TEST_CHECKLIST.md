# Authenticated Browser Smoke Test & Vercel Production Verification Checklist

Use this checklist to complete the remaining **Required release checks** listed in `Progress.md`.

Perform the browser tests while logged in with three different roles (viewer, editor, admin). Record pass/fail and any observations.

---

## 1. Preparation

- [ ] Confirm production URL is reachable: https://brandexsheet.vercel.app
- [ ] Have three test accounts ready (viewer, editor, admin)
- [ ] Browser developer tools open for network and console monitoring
- [ ] Access to the Vercel project dashboard (Project → Settings → Environment Variables)
- [ ] Access to the Supabase project dashboard (for role verification and outbox checks)

---

## 2. Viewer role

- [ ] Can log in successfully
- [ ] Can view the Dashboard (counts load without fetching full trademark payloads)
- [ ] Can open the Database list and see paginated records (50-row pages)
- [ ] Can use search and operational filters
- [ ] Can open a Record View and see the signed image (if present)
- [ ] Cannot create, edit, or delete records
- [ ] Cannot access any admin-only controls

---

## 3. Editor role

- [ ] Can log in successfully
- [ ] Can perform all viewer actions
- [ ] Can create a new trademark record
- [ ] Can edit an existing record
- [ ] Can upload or change a logo (private storage + short-lived signed URL)
- [ ] Changes appear in the list after refresh
- [ ] Cannot delete records

---

## 4. Admin role

- [ ] Can log in successfully
- [ ] Can perform all editor actions
- [ ] Can delete a single record
- [ ] Deleted record is removed from the Datasheet
- [ ] Corresponding outbox entry is created (check via Supabase Table Editor → `sheet_sync_outbox` or Edge Function logs)

---

## 5. Cross-cutting checks

- [ ] CSV export downloads only the currently filtered records
- [ ] A4 print / Record View renders correctly with brand colours
- [ ] No console errors or failed network requests related to missing secrets
- [ ] Signed image URLs expire as expected (do not remain permanently public)
- [ ] Role changes in the `profiles` table take effect after re-login

---

## 6. Vercel Production Verification (Item 2)

Perform these checks in the Vercel dashboard for the production environment.

### 6.1 Environment Variables (Critical)

- [ ] Only the following two variables exist for Production (and Preview if used):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] No variable named `SUPABASE_SERVICE_ROLE_KEY` is present
- [ ] No variable named `GOOGLE_APPS_SCRIPT_URL`, `GOOGLE_APPS_SCRIPT_SECRET`, or `SHEET_SYNC_CRON_SECRET` is present
- [ ] No other secrets appear under any `VITE_*` prefix
- [ ] Values match the correct Supabase project (publishable key only)

### 6.2 Build & Deployment Settings

- [ ] Root directory is the repository root (not a sub-folder)
- [ ] Build command matches `vercel.json`: `pnpm --filter @workspace/tm-tracker run build`
- [ ] Output directory matches `vercel.json`: `artifacts/tm-tracker/dist`
- [ ] Framework preset is Vite (or left as detected)
- [ ] Install command uses pnpm (`pnpm install`)

### 6.3 Deployment Health

- [ ] Latest Production deployment succeeded without build errors
- [ ] Deployment is linked to the expected Git commit / branch (main)
- [ ] No failed or cancelled deployments in the recent history that indicate secret or build problems
- [ ] Production domain `brandexsheet.vercel.app` resolves and serves the application

### 6.4 Runtime Spot Checks (from browser)

- [ ] Opening https://brandexsheet.vercel.app shows the login / AuthGate screen (no hard crash)
- [ ] After login, network requests go only to the Supabase project URL (no unexpected third-party calls carrying secrets)
- [ ] Browser console contains no errors about missing environment variables
- [ ] Page source / network tab never reveals a service-role key

### 6.5 Post-verification actions

- [ ] If any forbidden secret was found in Vercel, rotate that secret immediately in Supabase / Apps Script and remove it from Vercel
- [ ] Record the deployment URL / commit hash that was verified
- [ ] Update `Progress.md` – mark “Vercel production verification” as complete and set the new “Last updated” date

---

## 7. Sign-off

Date: _______________  
Tester: _______________  
Result: Pass / Fail (notes below)

Verified Production deployment commit / URL:



Notes:



After completing the checklist, mark the corresponding items as done in `Progress.md` and update the “Last updated” date.
