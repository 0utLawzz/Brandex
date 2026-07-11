# TM Tracker

A trademark tracking and management app — lets users log, search, and manage trademark applications with a dashboard showing stats by stage, city, and duplicate/TM-11 status.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/tm-tracker run dev` — run the React frontend (Vite)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (Replit-managed, set automatically)
- Required secret: `GOOGLE_SHEETS_API_KEY` — for the "Sync G-Sheets" feature
- Required secret: `SESSION_SECRET` — for session management

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, shadcn/ui, TanStack Query, Wouter (routing)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (ESM bundle)

## Where things live

- `artifacts/tm-tracker/` — React frontend (Vite)
- `artifacts/api-server/` — Express API server
- `lib/db/src/schema/trademarks.ts` — DB schema (source of truth)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/` — generated React Query hooks (from OpenAPI)
- `lib/api-zod/` — generated Zod schemas (from OpenAPI)

## Architecture decisions

- OpenAPI spec is the contract between frontend and backend; run `codegen` after any API shape change.
- Drizzle ORM with `drizzle-kit push` for dev schema changes; production schema is managed by Replit's Publish flow (no custom migration scripts).
- Frontend uses `import.meta.env.BASE_URL` as the router base so it works correctly under the Replit path-based proxy.

## Product

Dashboard with stats (total TMs, TM-11 filed, duplicates, city breakdown, stage distribution). Registry search with filters. Add/edit trademark form. "Sync G-Sheets" button for importing from Google Sheets.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing the OpenAPI spec — the client hooks and Zod schemas are generated, not hand-written.
- `DATABASE_URL` is runtime-managed by Replit; do not set it manually.
- After schema changes, run `pnpm --filter @workspace/db run push` to apply to dev DB.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
