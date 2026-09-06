# Security Policy

## Supported Versions

Only the latest `main` of Brandex is supported with security updates.

## Reporting a Vulnerability

**Do not** open a public GitHub issue for security vulnerabilities.

Email:
- **To:** net2outlawzz@gmail.com
- **Subject:** `[Security] Brandex Vulnerability Report`

Include:
- Description of the issue
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response targets
- Initial response: within 48 hours
- Investigation: within 1 week
- Fix: as soon as feasible by severity

---

## Architecture security model

- **Primary DB:** Supabase Postgres with Row Level Security
- **Auth:** Supabase Auth — roles `viewer` / `editor` / `admin` on `public.profiles`
- **Storage:** Private bucket; short-lived signed URLs for logos
- **Sheet mirror:** Secret-gated Apps Script (`BRANDEX_MIRROR_SECRET`); legacy browser writes disabled
- **Frontend env:** Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

The browser must never receive the service-role key or Apps Script secret.

---

## Production hardening checklist

Complete before treating production as locked down:

- [ ] Public sign-up **disabled** in Supabase Auth settings
- [ ] Staff invited from the dashboard only
- [ ] Roles verified: at least one test `viewer`, `editor`, and `admin`
- [ ] RLS blocks unauthorized reads/writes/deletes
- [ ] Vercel env contains **only** `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Service role key not in any frontend env, git history, or client bundle
- [ ] `BRANDEX_MIRROR_SECRET` set in Apps Script and matches Edge/import secret
- [ ] Edge Function invoked only with `Authorization: Bearer <SHEET_SYNC_CRON_SECRET>`
- [ ] Storage bucket private; no public logo URLs
- [ ] `.env` / secrets covered by `.gitignore`
- [ ] `pnpm audit` reviewed; high/critical issues addressed or accepted with reason
- [ ] Sheet mirror path tested: UI change → outbox → Sheet + ARCHIVE on delete

---

## Everyday practices

1. **Never commit secrets** — use `.env` locally and platform secrets in production.
2. **Rotate** service role, mirror secret, and cron secret if exposure is suspected.
3. **Least privilege** — default new users to `viewer`; promote deliberately.
4. **Keep dependencies updated** — `pnpm audit` / `pnpm update` on a regular cadence.
5. **Sheet is a mirror** — staff edits happen only in the Datasheet UI, not in the Sheet cells for live operations.

---

## Dependency checks

```bash
pnpm audit
pnpm update
```

---

## Disclosure

Security issues are disclosed after a fix is available. Credit may be given in release notes with reporter consent.

## Contact

- **Email:** net2outlawzz@gmail.com
- **GitHub:** [@0utLawzz](https://github.com/0utLawzz)
