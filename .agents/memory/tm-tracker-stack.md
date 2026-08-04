---
name: Trademark Tracker stack
description: Key facts about the Brandex Law Associate trademark tracker — design system, secrets, architecture decisions
---

# Trademark Tracker — key facts

**Why:** Durable facts not derivable from reading code alone.

## Design system
Neo-brutalist palette: cream `#F0E8D0`, orange `hsl(22 100% 39%)`, teal `hsl(164 83% 23%)`, black `#0C0C0C`. Fonts: Space Grotesk (body), Bebas Neue (serif display), DM Mono (mono). Radius: 0. Custom CSS classes: `.nb-border`, `.nb-shadow`, `.nb-button` in `artifacts/tm-tracker/src/index.css`.

## Secrets required
- `DATABASE_URL` — provisioned automatically by Replit
- `GOOGLE_SHEETS_API_KEY` — configured for the live Google Sheets import used by both desktop and mobile
- `GOOGLE_SHEETS_APPS_SCRIPT_URL` — configured for Google Sheets write-back and audit forwarding
- `SESSION_SECRET` — already set

## Architecture decisions
- OpenAPI spec is the contract; run `pnpm --filter @workspace/api-spec run codegen` after any API change
- Drizzle `push` for dev schema; Replit Publish flow handles production schema diff
- `source` field on Trademark distinguishes `local` (DB) vs `sheets` (Google Sheets) records
- Frontend uses `import.meta.env.BASE_URL` as Wouter router base for path-based proxy compatibility

**How to apply:** Any change to the API shape must re-run codegen. Any Google Sheets work needs the API key secret set first.
