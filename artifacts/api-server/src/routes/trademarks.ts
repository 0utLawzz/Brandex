import { Router, type IRouter } from "express";
import { eq, or, ilike, and, sql } from "drizzle-orm";
import { db, trademarksTable } from "@workspace/db";
import {
  ListTrademarksQueryParams,
  CreateTrademarkBody,
  GetTrademarkParams,
  UpdateTrademarkParams,
  UpdateTrademarkBody,
  DeleteTrademarkParams,
  ListTrademarksResponseItem,
  GetTrademarkResponse,
  CreateTrademarkResponse,
  UpdateTrademarkResponse,
  GetTrademarkStatsResponse,
  SyncFromSheetsResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function parseId(raw: string | string[]): number {
  const str = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(str, 10);
}

function toSafeString(val: unknown): string {
  return typeof val === "string" ? val.trim() : "";
}

// GET /trademarks
router.get("/trademarks", async (req, res): Promise<void> => {
  const parsed = ListTrademarksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, stage, city } = parsed.data;

  // Build conditions
  const conditions = [];

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(trademarksTable.tmNo, term),
        ilike(trademarksTable.appName, term),
        ilike(trademarksTable.folderNo, term),
      ),
    );
  }

  if (stage && stage.trim()) {
    conditions.push(ilike(trademarksTable.stage, stage.trim()));
  }

  if (city && city.trim()) {
    conditions.push(ilike(trademarksTable.city, city.trim()));
  }

  const rows =
    conditions.length > 0
      ? await db
          .select()
          .from(trademarksTable)
          .where(and(...conditions))
          .orderBy(trademarksTable.id)
      : await db.select().from(trademarksTable).orderBy(trademarksTable.id);

  const result = rows.map((row) =>
    ListTrademarksResponseItem.parse({
      ...row,
      date: row.date ?? null,
      folderNo: row.folderNo ?? null,
      appName: row.appName ?? null,
      appClass: row.appClass ?? null,
      tmNo: row.tmNo ?? null,
      stage: row.stage ?? null,
      subStage: row.subStage ?? null,
      notes: row.notes ?? null,
      city: row.city ?? null,
      source: row.source ?? "local",
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    }),
  );

  res.json(result);
});

// POST /trademarks
router.post("/trademarks", async (req, res): Promise<void> => {
  const parsed = CreateTrademarkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(trademarksTable)
    .values({
      ...parsed.data,
      source: "local",
      updatedAt: new Date(),
    })
    .returning();

  res.status(201).json(
    CreateTrademarkResponse.parse({
      ...row,
      date: row.date ?? null,
      folderNo: row.folderNo ?? null,
      appName: row.appName ?? null,
      appClass: row.appClass ?? null,
      tmNo: row.tmNo ?? null,
      stage: row.stage ?? null,
      subStage: row.subStage ?? null,
      notes: row.notes ?? null,
      city: row.city ?? null,
      source: row.source ?? "local",
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    }),
  );
});

// GET /trademarks/stats  — must come before /:id
router.get("/trademarks/stats", async (req, res): Promise<void> => {
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(trademarksTable);

  const byStageResult = await db
    .select({
      stage: trademarksTable.stage,
      count: sql<number>`count(*)::int`,
    })
    .from(trademarksTable)
    .groupBy(trademarksTable.stage);

  const byCityResult = await db
    .select({
      city: trademarksTable.city,
      count: sql<number>`count(*)::int`,
    })
    .from(trademarksTable)
    .groupBy(trademarksTable.city);

  const [dupsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(trademarksTable)
    .where(eq(trademarksTable.isDuplicate, true));

  const [tm11Result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(trademarksTable)
    .where(eq(trademarksTable.isTm11, true));

  res.json(
    GetTrademarkStatsResponse.parse({
      total: totalResult?.count ?? 0,
      byStage: byStageResult.map((r) => ({
        stage: r.stage ?? "Unknown",
        count: r.count,
      })),
      byCity: byCityResult.map((r) => ({
        city: r.city ?? "Unknown",
        count: r.count,
      })),
      duplicates: dupsResult?.count ?? 0,
      tm11Count: tm11Result?.count ?? 0,
    }),
  );
});

// POST /trademarks/sync — sync from Google Sheets CSV
router.post("/trademarks/sync", async (req, res): Promise<void> => {
  const csvUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTelzPMvLPhdXugWg7No78vyJXgc3e3h4mKDcQLAAsSvLRWQe36fyqlk7mRwIsQSB7PabmNLqKXG2cz/pub?output=csv";

  let csvText: string;
  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }
    csvText = await response.text();
  } catch (err) {
    logger.error({ err }, "Failed to fetch Google Sheets CSV");
    res.status(502).json({ error: "Failed to fetch Google Sheets data" });
    return;
  }

  // Parse CSV
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    res.json(SyncFromSheetsResponse.parse({ synced: 0, message: "No data rows found" }));
    return;
  }

  // Header row — detect column indices dynamically
  const headers = lines[0].split(",").map((h) => h.replace(/\r/g, "").trim().toLowerCase());

  const colIdx = (names: string[]): number => {
    for (const name of names) {
      const idx = headers.findIndex((h) => h.includes(name));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const dateIdx = colIdx(["date"]);
  const folderIdx = colIdx(["folder", "case"]);
  const appNameIdx = colIdx(["app name", "application name", "appname"]);
  const appClassIdx = colIdx(["class", "application class"]);
  const tmNoIdx = colIdx(["tm", "trademark no", "trademark"]);
  const stageIdx = colIdx(["stage"]);
  const subStageIdx = colIdx(["substage", "sub stage", "sub-stage"]);
  const duplicateIdx = colIdx(["duplicate"]);
  const tm11Idx = colIdx(["tm-11", "tm11"]);
  const notesIdx = colIdx(["note"]);
  const cityIdx = colIdx(["city"]);

  let synced = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r/g, "");
    if (!line.trim()) continue;

    // Simple CSV split (handles quoted values naively)
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));

    const tmNo = tmNoIdx >= 0 ? toSafeString(cells[tmNoIdx]) : "";
    const appName = appNameIdx >= 0 ? toSafeString(cells[appNameIdx]) : "";

    if (!tmNo && !appName) continue;

    const isDupRaw = duplicateIdx >= 0 ? toSafeString(cells[duplicateIdx]).toLowerCase() : "";
    const isTm11Raw = tm11Idx >= 0 ? toSafeString(cells[tm11Idx]).toLowerCase() : "";

    const record = {
      date: dateIdx >= 0 ? toSafeString(cells[dateIdx]) || null : null,
      folderNo: folderIdx >= 0 ? toSafeString(cells[folderIdx]) || null : null,
      appName: appName || null,
      appClass: appClassIdx >= 0 ? toSafeString(cells[appClassIdx]) || null : null,
      tmNo: tmNo || null,
      stage: stageIdx >= 0 ? toSafeString(cells[stageIdx]) || null : null,
      subStage: subStageIdx >= 0 ? toSafeString(cells[subStageIdx]) || null : null,
      isDuplicate: ["true", "yes", "1"].includes(isDupRaw),
      isTm11: ["true", "yes", "1"].includes(isTm11Raw),
      notes: notesIdx >= 0 ? toSafeString(cells[notesIdx]) || null : null,
      city: cityIdx >= 0 ? toSafeString(cells[cityIdx]) || null : null,
      source: "sheets" as const,
      updatedAt: new Date(),
    };

    // Upsert by tmNo if present, otherwise insert
    if (tmNo) {
      const existing = await db
        .select()
        .from(trademarksTable)
        .where(eq(trademarksTable.tmNo, tmNo))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(trademarksTable)
          .set(record)
          .where(eq(trademarksTable.tmNo, tmNo));
      } else {
        await db.insert(trademarksTable).values(record);
      }
    } else {
      await db.insert(trademarksTable).values(record);
    }

    synced++;
  }

  res.json(
    SyncFromSheetsResponse.parse({
      synced,
      message: `Successfully synced ${synced} records from Google Sheets`,
    }),
  );
});

// GET /trademarks/:id
router.get("/trademarks/:id", async (req, res): Promise<void> => {
  const { id: idRaw } = GetTrademarkParams.parse(req.params);
  const id = typeof idRaw === "number" ? idRaw : parseInt(String(idRaw), 10);

  const [row] = await db
    .select()
    .from(trademarksTable)
    .where(eq(trademarksTable.id, id))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Trademark not found" });
    return;
  }

  res.json(
    GetTrademarkResponse.parse({
      ...row,
      date: row.date ?? null,
      folderNo: row.folderNo ?? null,
      appName: row.appName ?? null,
      appClass: row.appClass ?? null,
      tmNo: row.tmNo ?? null,
      stage: row.stage ?? null,
      subStage: row.subStage ?? null,
      notes: row.notes ?? null,
      city: row.city ?? null,
      source: row.source ?? "local",
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    }),
  );
});

// PUT /trademarks/:id
router.put("/trademarks/:id", async (req, res): Promise<void> => {
  const { id: idRaw } = UpdateTrademarkParams.parse(req.params);
  const id = typeof idRaw === "number" ? idRaw : parseInt(String(idRaw), 10);

  const bodyParsed = UpdateTrademarkBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  // Build a clean update payload; omit null booleans since the column is non-nullable
  const { isDuplicate, isTm11, ...rest } = bodyParsed.data;
  const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if (isDuplicate !== null && isDuplicate !== undefined) updateData.isDuplicate = isDuplicate;
  if (isTm11 !== null && isTm11 !== undefined) updateData.isTm11 = isTm11;

  const [row] = await db
    .update(trademarksTable)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set(updateData as any)
    .where(eq(trademarksTable.id, id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Trademark not found" });
    return;
  }

  res.json(
    UpdateTrademarkResponse.parse({
      ...row,
      date: row.date ?? null,
      folderNo: row.folderNo ?? null,
      appName: row.appName ?? null,
      appClass: row.appClass ?? null,
      tmNo: row.tmNo ?? null,
      stage: row.stage ?? null,
      subStage: row.subStage ?? null,
      notes: row.notes ?? null,
      city: row.city ?? null,
      source: row.source ?? "local",
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    }),
  );
});

// DELETE /trademarks/:id
router.delete("/trademarks/:id", async (req, res): Promise<void> => {
  const { id: idRaw } = DeleteTrademarkParams.parse(req.params);
  const id = typeof idRaw === "number" ? idRaw : parseInt(String(idRaw), 10);

  const result = await db
    .delete(trademarksTable)
    .where(eq(trademarksTable.id, id))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Trademark not found" });
    return;
  }

  res.status(204).send();
});

export default router;
