import { Router, type IRouter } from "express";
import { eq, or, ilike, and, sql, desc } from "drizzle-orm";
import { db, trademarksTable, changeLogTable } from "@workspace/db";
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

// Stage progression order for forward-only workflow
const STAGE_ORDER = ['STAGE 1', 'STAGE 2', 'STAGE 3', 'STAGE 4'];

function canProgressStage(currentStage: string | null, newStage: string): boolean {
  if (!currentStage) return true; // Allow any stage if no current stage
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const newIndex = STAGE_ORDER.indexOf(newStage);
  
  // If either stage is not in the predefined order, allow the change
  if (currentIndex === -1 || newIndex === -1) return true;
  
  // Only allow forward progression (newIndex > currentIndex)
  return newIndex > currentIndex;
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
          .orderBy(sql`TO_DATE(NULLIF(TRIM(${trademarksTable.date}), ''), 'DD-Mon-YYYY') DESC NULLS LAST`)
      : await db
          .select()
          .from(trademarksTable)
          .orderBy(sql`TO_DATE(NULLIF(TRIM(${trademarksTable.date}), ''), 'DD-Mon-YYYY') DESC NULLS LAST`);

  const result = rows.map((row) =>
    ListTrademarksResponseItem.parse({
      ...row,
      date: row.date ?? null,
      prefix: row.prefix ?? null,
      clientNo: row.clientNo ?? null,
      caseNo: row.caseNo ?? null,
      folderNo: row.folderNo ?? null,
      appName: row.appName ?? null,
      appClass: row.appClass ?? null,
      tmNo: row.tmNo ?? null,
      city: row.city ?? null,
      stage: row.stage ?? null,
      subStage: row.subStage ?? null,
      status: row.status ?? null,
      notes: row.notes ?? null,
      imageUrl: row.imageUrl ?? null,
      pdfUrl: row.pdfUrl ?? null,
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

  // Log the creation
  await db.insert(changeLogTable).values({
    trademarkId: row.id,
    field: "CREATE",
    oldValue: null,
    newValue: JSON.stringify(parsed.data),
    changedBy: "system",
  });

  res.status(201).json(
    CreateTrademarkResponse.parse({
      ...row,
      date: row.date ?? null,
      prefix: row.prefix ?? null,
      clientNo: row.clientNo ?? null,
      caseNo: row.caseNo ?? null,
      folderNo: row.folderNo ?? null,
      appName: row.appName ?? null,
      appClass: row.appClass ?? null,
      tmNo: row.tmNo ?? null,
      city: row.city ?? null,
      stage: row.stage ?? null,
      subStage: row.subStage ?? null,
      status: row.status ?? null,
      notes: row.notes ?? null,
      imageUrl: row.imageUrl ?? null,
      pdfUrl: row.pdfUrl ?? null,
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
    .from(trademarksTable)
    .where(sql`NULLIF(TRIM(COALESCE(${trademarksTable.tmNo}, '')), '') IS NOT NULL`);

  const byStageResult = await db
    .select({
      stage: trademarksTable.stage,
      count: sql<number>`count(*)::int`,
    })
    .from(trademarksTable)
    .where(sql`NULLIF(TRIM(COALESCE(${trademarksTable.stage}, '')), '') IS NOT NULL`)
    .groupBy(trademarksTable.stage);

  const [dupsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(trademarksTable)
    .where(sql`${trademarksTable.isDuplicate} = true AND NULLIF(TRIM(COALESCE(${trademarksTable.tmNo}, '')), '') IS NOT NULL`);

  const [tm11Result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(trademarksTable)
    .where(sql`${trademarksTable.isTm11} = true AND NULLIF(TRIM(COALESCE(${trademarksTable.tmNo}, '')), '') IS NOT NULL`);

  const byNumericStageResult = await db
    .select({
      stage: trademarksTable.stage,
      count: sql<number>`count(*)::int`,
    })
    .from(trademarksTable)
    .where(sql`${trademarksTable.stage} IN ('STAGE 1', 'STAGE 2', 'STAGE 3', 'STAGE 4') AND NULLIF(TRIM(COALESCE(${trademarksTable.tmNo}, '')), '') IS NOT NULL`)
    .groupBy(trademarksTable.stage);

  const byAssignedSubStageResult = await db
    .select({
      subStage: trademarksTable.subStage,
      count: sql<number>`count(*)::int`,
    })
    .from(trademarksTable)
    .where(sql`LOWER(${trademarksTable.stage}) = 'assigned' AND NULLIF(TRIM(COALESCE(${trademarksTable.subStage}, '')), '') IS NOT NULL`)
    .groupBy(trademarksTable.subStage);

  res.json(
    GetTrademarkStatsResponse.parse({
      total: totalResult?.count ?? 0,
      byStage: byStageResult.map((r) => ({
        stage: r.stage ?? "Unknown",
        count: r.count,
      })),
      // Kept as an empty array for backwards-compatible mobile/web clients.
      byCity: [],
      duplicates: dupsResult?.count ?? 0,
      tm11Count: tm11Result?.count ?? 0,
      byNumericStage: byNumericStageResult.map((r) => ({
        stage: r.stage ?? "Unknown",
        count: r.count,
      })),
      byAssignedSubStage: byAssignedSubStageResult.map((r) => ({
        subStage: r.subStage ?? "Unassigned",
        count: r.count,
      })),
    }),
  );
});

// POST /trademarks/sync — sync from Google Sheets API v4
// Column order (A-K): DATE | CASE NO | APP NAME | TM NO | CLASS | STATUS | SUB STATUS | Duplicate | TM-11 | Notes | City
// Data starts at row 2 (row 1 is the frozen header).
router.post("/trademarks/sync", async (req, res): Promise<void> => {
  const spreadsheetId = "1yu27k_3Z6cCJmcnQI52z1dIC52Zi9ZxaKlo9wJiNFiQ";
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: "GOOGLE_SHEETS_API_KEY not configured" });
    return;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:K?key=${apiKey}`;

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

  // Clear audit rows first because change_log references trademarks.
  // Then clear synced rows so removed sheet rows don't linger in the DB.
  const syncedTrademarkIds = await db
    .select({ id: trademarksTable.id })
    .from(trademarksTable)
    .where(eq(trademarksTable.source, "sheets"));
  for (const { id } of syncedTrademarkIds) {
    await db.delete(changeLogTable).where(eq(changeLogTable.trademarkId, id));
  }
  await db.delete(trademarksTable).where(eq(trademarksTable.source, "sheets"));

  // Parse case number from folderNo (format: X-284-001)
  const parseCaseNumber = (caseNo: string | null) => {
    if (!caseNo) return { prefix: 'X', clientNo: '', caseNo: '' };
    const parts = caseNo.split('-');
    if (parts.length >= 3) {
      return { prefix: parts[0], clientNo: parts[1], caseNo: parts[2] };
    }
    return { prefix: 'X', clientNo: '', caseNo: '' };
  };

  const records = [];
  for (const row of rows) {
    const tmNo = cell(row, COL.tmNo);
    const appName = cell(row, COL.appName);
    const folderNo = cell(row, COL.folderNo);
    const city = cell(row, COL.city);
    const stage = cell(row, COL.stage);

    // Skip completely empty rows
    if (!tmNo && !appName) continue;

    // Parse case number components
    const { prefix, clientNo: clientNo, caseNo: caseNum } = parseCaseNumber(folderNo);

    const record = {
      date: cell(row, COL.date) || new Date().toISOString().split('T')[0],
      prefix: prefix || 'X',
      clientNo: clientNo || '',
      caseNo: caseNum || '',
      folderNo: folderNo || null,
      appName: appName || null,
      appClass: cell(row, COL.appClass) || null,
      tmNo: tmNo || null,
      city: city || 'Islamabad',
      stage: stage || 'STAGE 1',
      subStage: cell(row, COL.subStage) || null,
      status: cell(row, COL.subStage) || stage || 'STAGE 1',
      isDuplicate: bool(cell(row, COL.isDuplicate)),
      isTm11: bool(cell(row, COL.isTm11)),
      notes: cell(row, COL.notes) || null,
      imageUrl: null,
      pdfUrl: null,
      source: "sheets" as const,
      updatedAt: new Date(),
    };

    records.push(record);
  }

  let synced = 0;
  let skipped = 0;
  for (const record of records) {
    try {
      await db.insert(trademarksTable).values(record);
      synced += 1;
    } catch (err) {
      skipped += 1;
      logger.warn(
        {
          errorMessage: err instanceof Error ? err.message : String(err),
          tmNo: record.tmNo,
          folderNo: record.folderNo,
        },
        "Skipping malformed Google Sheets row",
      );
    }
  }

  res.json(
    SyncFromSheetsResponse.parse({
      synced,
      message:
        skipped > 0
          ? `Synced ${synced} records from Google Sheets; skipped ${skipped} invalid rows`
          : `Successfully synced ${synced} records from Google Sheets`,
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
      prefix: row.prefix ?? null,
      clientNo: row.clientNo ?? null,
      caseNo: row.caseNo ?? null,
      folderNo: row.folderNo ?? null,
      appName: row.appName ?? null,
      appClass: row.appClass ?? null,
      tmNo: row.tmNo ?? null,
      city: row.city ?? null,
      stage: row.stage ?? null,
      subStage: row.subStage ?? null,
      status: row.status ?? null,
      notes: row.notes ?? null,
      imageUrl: row.imageUrl ?? null,
      pdfUrl: row.pdfUrl ?? null,
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

  // Get the current row for change logging and validation
  const [currentRow] = await db
    .select()
    .from(trademarksTable)
    .where(eq(trademarksTable.id, id))
    .limit(1);

  if (!currentRow) {
    res.status(404).json({ error: "Trademark not found" });
    return;
  }

  // Validate stage progression (forward-only workflow)
  if (bodyParsed.data.stage && currentRow.stage) {
    if (!canProgressStage(currentRow.stage, bodyParsed.data.stage)) {
      res.status(400).json({ 
        error: `Cannot move from ${currentRow.stage} to ${bodyParsed.data.stage}. Status can only progress forward.` 
      });
      return;
    }
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

  // Log changes
  for (const [key, newValue] of Object.entries(bodyParsed.data)) {
    const oldValue = (currentRow as any)[key];
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      await db.insert(changeLogTable).values({
        trademarkId: id,
        field: key,
        oldValue: oldValue ? String(oldValue) : null,
        newValue: newValue ? String(newValue) : null,
        changedBy: "system",
      });
    }
  }

  const sheetsWritebackUrl = process.env.GOOGLE_SHEETS_APPS_SCRIPT_URL;
  if (!sheetsWritebackUrl) {
    res.status(503).json({
      error:
        "Database updated, but Google Sheets write-back is not configured. Set GOOGLE_SHEETS_APPS_SCRIPT_URL.",
    });
    return;
  }

  try {
    const writeback = await fetch(sheetsWritebackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateTrademark",
        trademark: {
          id: row.id,
          tmNo: row.tmNo,
          appName: row.appName,
          folderNo: row.folderNo,
          appClass: row.appClass,
          date: row.date,
          stage: row.stage,
          subStage: row.subStage,
          city: row.city,
          isDuplicate: row.isDuplicate,
          isTm11: row.isTm11,
          notes: row.notes,
        },
        auditLog: {
          trademarkId: row.id,
          tmNo: row.tmNo,
          updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
          changes: bodyParsed.data,
        },
      }),
    });
    const result = (await writeback.json()) as { ok?: boolean; error?: string };
    if (!writeback.ok || result.ok !== true) {
      logger.error({ status: writeback.status, result }, "Google Sheets write-back failed");
      res.status(502).json({ error: result.error ?? "Google Sheets write-back failed" });
      return;
    }
  } catch (err) {
    logger.error({ err }, "Google Sheets write-back request failed");
    res.status(502).json({ error: "Google Sheets write-back request failed" });
    return;
  }

  res.json(
    UpdateTrademarkResponse.parse({
      ...row,
      date: row.date ?? null,
      prefix: row.prefix ?? null,
      clientNo: row.clientNo ?? null,
      caseNo: row.caseNo ?? null,
      folderNo: row.folderNo ?? null,
      appName: row.appName ?? null,
      appClass: row.appClass ?? null,
      tmNo: row.tmNo ?? null,
      city: row.city ?? null,
      stage: row.stage ?? null,
      subStage: row.subStage ?? null,
      status: row.status ?? null,
      notes: row.notes ?? null,
      imageUrl: row.imageUrl ?? null,
      pdfUrl: row.pdfUrl ?? null,
      source: row.source ?? "local",
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    }),
  );
});

// GET /trademarks/:id/change-log
router.get("/trademarks/:id/change-log", async (req, res): Promise<void> => {
  const { id: idRaw } = GetTrademarkParams.parse(req.params);
  const id = typeof idRaw === "number" ? idRaw : parseInt(String(idRaw), 10);

  const logs = await db
    .select()
    .from(changeLogTable)
    .where(eq(changeLogTable.trademarkId, id))
    .orderBy(desc(changeLogTable.changedAt));

  res.json(logs.map((log) => ({
    ...log,
    changedAt: log.changedAt ? log.changedAt.toISOString() : null,
  })));
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
