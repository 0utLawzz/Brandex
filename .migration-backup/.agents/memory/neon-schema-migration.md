---
name: Neon schema migration
description: What to do when switching a pnpm/Drizzle project from Replit Postgres to Neon PostgreSQL.
---

When the `DATABASE_URL` secret is switched from Replit Postgres to an external Neon PostgreSQL database, the `trademarks` table (and any other schema objects) do not exist on Neon until the Drizzle schema is explicitly pushed there.

**Why:** Replit Postgres and Neon are separate database instances. Drizzle schema pushes are provider-specific. The previous push to Replit Postgres does not carry over to Neon.

**How to apply:**
1. Ensure the new `DATABASE_URL` points to Neon and contains `sslmode=require`.
2. Run the Drizzle push from the `lib/db` package:
   ```bash
   cd lib/db && pnpm exec drizzle-kit push
   ```
3. Verify by querying the database directly, e.g.:
   ```bash
   cd lib/db && node -e "const {Pool}=require('pg'); const p=new Pool({connectionString:process.env.DATABASE_URL,max:1}); p.query('SELECT count(*)::int FROM trademarks').then(r=>console.log(r.rows[0])).finally(()=>p.end());"
   ```
4. After the schema is present, sync source data (Google Sheets, seed scripts, etc.) as needed.

**How to prevent:** Any future database-provider switch must be followed by a schema push and data migration, not just a secret change.
