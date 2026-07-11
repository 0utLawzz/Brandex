---
name: Google Sheets sync performance
description: The current sync endpoint is synchronous and too slow for mobile when the sheet has many rows.
---

The `/api/trademarks/sync` endpoint reads the entire Google Sheet, maps each row, and inserts/updates every trademark in a single synchronous request. For 1,000+ rows this takes 60–120 seconds, causing the mobile client (and default curl/HTTP clients) to time out.

**Why:** The server does not stream progress or return early. The client disconnects while the server is still processing. After the timeout, the data may still land in the database, but the user sees no confirmation.

**How to apply:**
- For now, expect the first sync after a schema push to take a long time and look at the database/API logs to confirm completion rather than relying on the HTTP response.
- Consider reworking sync to:
  - return immediately with a job ID and process in the background, or
  - process rows in batches and stream progress via SSE/WebSocket, or
  - make the client poll a sync-status endpoint.

**How to prevent:** Any bulk-import feature on mobile should be designed async; synchronous endpoints will always fail at moderate scale.
