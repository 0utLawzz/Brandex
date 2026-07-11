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

// POST /trademarks/sync — sync from Google Sheets API v4
// Column order (A-K): DATE | CASE NO | APP NAME | TM NO | CLASS | STATUS | SUB STATUS | Duplicate | TM-11 | Notes | City
// Data starts at row 2 (row 1 is the frozen header).
router.post("/trademarks/sync", async (req, res): Promise<void> => {
  const SPREADSHEET_ID = "1yu27k_3Z6cCJmcnQI52z1dIC52Zi9ZxaKlo9wJiNFiQ";
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: "GOOGLE_SHEETS_API_KEY not configured" });
    return;
  }

  // Fetch data starting from A2 so we skip the header row entirely
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A2:K?key=${apiKey}`;

  let rows: string[][];
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text();
      logger.error({ status: response.status, body }, "Google Sheets API error");
      res.status(502).json({ error: `Google Sheets API error: ${response.status}` });
      return;
    }
    const json = (await response.json()) as { values?: string[][] };
    rows = json.values ?? [];
  } catch (err) {
    logger.error({ err }, "Failed to fetch from Google Sheets API");
    res.status(502).json({ error: "Failed to fetch Google Sheets data" });
    return;
  }

  if (rows.length === 0) {
    res.json(SyncFromSheetsResponse.parse({ synced: 0, message: "No data rows found" }));
    return;
  }

  // Column indices (0-based, matching A-K positionally)
  const COL = {
    date: 0,      // A – DATE
    folderNo: 1,  // B – CASE NO
    appName: 2,   // C – APP NAME
    tmNo: 3,      // D – TM NO
    appClass: 4,  // E – CLASS
    stage: 5,     // F – STATUS
    subStage: 6,  // G – APPLICATION SUB STATUS
    isDuplicate: 7, // H – Duplicate
    isTm11: 8,    // I – TM-11
    notes: 9,     // J – Notes
    city: 10,     // K – City
  };

  const cell = (row: string[], idx: number): string =>
    (row[idx] ?? "").trim();

  const bool = (val: string): boolean =>
    ["true", "yes", "1"].includes(val.toLowerCase());

  // Clear all previously synced-from-sheets rows before re-importing
  // so removed rows in the sheet don't linger in the DB.
  await db.delete(trademarksTable).where(eq(trademarksTable.source, "sheets"));

  let synced = 0;

  for (const row of rows) {
    const tmNo = cell(row, COL.tmNo);
    const appName = cell(row, COL.appName);

    // Skip completely empty rows
    if (!tmNo && !appName) continue;

    const record = {
      date: cell(row, COL.date) || null,
      folderNo: cell(row, COL.folderNo) || null,
      appName: appName || null,
      appClass: cell(row, COL.appClass) || null,
      tmNo: tmNo || null,
      stage: cell(row, COL.stage) || null,
      subStage: cell(row, COL.subStage) || null,
      isDuplicate: bool(cell(row, COL.isDuplicate)),
      isTm11: bool(cell(row, COL.isTm11)),
      notes: cell(row, COL.notes) || null,
      city: cell(row, COL.city) || null,
      source: "sheets" as const,
      updatedAt: new Date(),
    };

    await db.insert(trademarksTable).values(record);
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
