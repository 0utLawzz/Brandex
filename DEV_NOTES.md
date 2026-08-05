# Brandex — Developer Notes

Internal architecture notes for developers working on this codebase.

---

## Stack

- **Monorepo:** pnpm workspaces
- **Runtime:** Node.js 18+, TypeScript 5.9
- **Mobile:** Expo (React Native) with expo-router
- **Web:** React + Vite + TailwindCSS + shadcn/ui
- **API:** Express 5
- **Database:** PostgreSQL (Neon) + Drizzle ORM
- **Validation:** Zod v4, drizzle-zod
- **API contract:** OpenAPI spec → Orval codegen → React Query hooks + Zod schemas
- **Build:** esbuild (API server)

---

## Architecture Decisions

### OpenAPI as the contract
`lib/api-spec/openapi.yaml` is the single source of truth for the API shape. After any API change, run:
```bash
pnpm --filter @workspace/api-spec run codegen
```
This regenerates `lib/api-client-react` (React Query hooks) and `lib/api-zod` (Zod schemas).

### Drizzle ORM — dev vs. production
- **Dev:** `pnpm --filter @workspace/db run push` — drizzle-kit push (no migration files needed)
- **Production:** Migrations are handled manually. Run push against the production Neon database after verifying on dev.
- Schema source of truth: `lib/db/src/schema/trademarks.ts`

### Shared API base URL (mobile)
The mobile app reads `EXPO_PUBLIC_DOMAIN` from the environment and calls `setBaseUrl(...)` at startup (see `app/_layout.tsx`). For local dev, this defaults to `http://localhost:8080`. For production, set it to your Vercel API domain.

### Web app routing
The web app uses Wouter for client-side routing. `BASE_PATH` defaults to `/` and works correctly on both local dev and Vercel.

### Source tagging (`source` field)
Every trademark record has a `source` field: `"local"` (entered directly) or `"sheets"` (synced from Google Sheets). The sync endpoint (`POST /api/trademarks/sync`) deletes all `source=sheets` rows before re-importing — so synced records are always fresh.

---

## Key Commands

```bash
# Install
pnpm install

# Type check everything
pnpm run typecheck:libs
pnpm --filter @workspace/tm-tracker-mobile run typecheck

# Build API server (ESM bundle)
pnpm --filter @workspace/api-server run build

# DB schema push (dev only — requires DATABASE_URL in .env)
pnpm --filter @workspace/db run push

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

---

## Port Convention (local dev)

| Service | Port |
|---------|------|
| API server | 8080 |
| Web app (Vite) | 5173 (default) |
| Mobile (Expo) | 19006 |

---

## Where Things Live

```
lib/db/src/schema/trademarks.ts   ← DB schema (source of truth)
lib/api-spec/openapi.yaml          ← API contract (source of truth)
lib/api-client-react/src/          ← Generated React Query hooks (DO NOT hand-edit)
lib/api-zod/src/                   ← Generated Zod schemas (DO NOT hand-edit)
artifacts/api-server/src/routes/   ← Express route handlers
artifacts/tm-tracker-mobile/app/   ← Expo screens
artifacts/tm-tracker/src/pages/    ← Web pages
google-apps-script/Code.gs         ← Apps Script for Google Sheets write-back
```

---

## Common Gotchas

- Always run `codegen` after changing the OpenAPI spec — client hooks and Zod schemas are generated, not hand-written.
- `DATABASE_URL` must end with `?sslmode=require` for Neon production connections.
- `DATABASE_URL_UNPOOLED` is only needed for `drizzle-kit push` — do not use it for the running API.
- The mobile app's `EXPO_PUBLIC_*` variables are baked into the JS bundle at build time — they require a rebuild to take effect.
- The web `vite.config.ts` proxies `/api` to `localhost:8080` in dev. In production (Vercel), the API is a serverless function at `/api`.
