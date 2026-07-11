---
name: Mobile API base URL
description: How the Expo mobile app resolves the remote API base URL in the Replit environment.
---

The TM Tracker mobile app calls the API server at `https://<REPLIT_DEV_DOMAIN>/api/...`. The generated API client paths already include the `/api` prefix, so the base URL only needs the scheme and domain.

**Why:** In `_layout.tsx`, `setBaseUrl` is called at module level. Expo inlines `process.env.EXPO_PUBLIC_DOMAIN` at bundle time. The Replit Expo workflow sets it to `REPLIT_DEV_DOMAIN`.

**How to apply:**
- Keep the module-level call in `app/_layout.tsx`:
  ```ts
  const API_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
  if (API_DOMAIN) setBaseUrl(`https://${API_DOMAIN}`);
  ```
- Do not append `/api` here; the generated client does that.
- If the app cannot reach the API, verify the workflow env var `EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN` is present and that the API server workflow is running.

**How to prevent:** Avoid hard-coding domains in mobile source; rely on the env variable injected by the workflow.
