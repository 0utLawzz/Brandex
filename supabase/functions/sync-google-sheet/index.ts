import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BATCH_SIZE = 50;

Deno.serve(async (request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const sheetUrl = Deno.env.get("GOOGLE_APPS_SCRIPT_URL");
  const sheetSecret = Deno.env.get("GOOGLE_APPS_SCRIPT_SECRET");
  const cronSecret = Deno.env.get("SHEET_SYNC_CRON_SECRET");

  if (!supabaseUrl || !serviceRoleKey || !sheetUrl || !sheetSecret || !cronSecret) {
    return Response.json({ error: "Sheet mirror environment is incomplete" }, { status: 500 });
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: jobs, error: loadError } = await supabase
    .from("sheet_sync_outbox")
    .select("id,trademark_id,action,payload,attempt_count")
    .in("state", ["pending", "failed"])
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (loadError) {
    return Response.json({ error: loadError.message }, { status: 500 });
  }

  let synced = 0;
  let failed = 0;

  for (const job of jobs ?? []) {
    await supabase
      .from("sheet_sync_outbox")
      .update({ state: "processing", attempt_count: job.attempt_count + 1 })
      .eq("id", job.id);

    try {
      const response = await fetch(sheetUrl, {
        method: "POST",
        headers: { "content-type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: job.action === "delete" ? "mirrorDelete" : "mirrorUpsert",
          secret: sheetSecret,
          id: job.trademark_id,
          record: job.payload,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || `Sheet mirror failed with ${response.status}`);
      }

      await supabase
        .from("sheet_sync_outbox")
        .update({ state: "synced", processed_at: new Date().toISOString(), last_error: null })
        .eq("id", job.id);
      synced += 1;
    } catch (error) {
      await supabase
        .from("sheet_sync_outbox")
        .update({ state: "failed", last_error: error instanceof Error ? error.message : String(error) })
        .eq("id", job.id);
      failed += 1;
    }
  }

  return Response.json({ processed: (jobs ?? []).length, synced, failed });
});
