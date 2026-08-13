import { Router, type IRouter } from "express";
import { eq, or, ilike, and, sql, desc, asc } from "drizzle-orm";
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


// GET /trademarks
router.get("/trademarks", async (req, res): Promise<void> => {
  const parsed = ListTrademarksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, stage, city } = parsed.data;
  const sort = typeof req.query.sort === 'string' ? req.query.sort : undefined;

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

  const orderBy = sort === 'az'
    ? asc(trademarksTable.appName)
    : desc(trademarksTable.updatedAt);

  const rows =
    conditions.length > 0
      ? await db
          .select()
          .from(trademarksTable)
          .where(and(...conditions))
          .orderBy(orderBy)
      : await db
          .select()
          .from(trademarksTable)
          .orderBy(orderBy);

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
      subStage: parsed.data.subStage ?? parsed.data.stage ?? "STAGE 1",
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

// GET /change-log — all change log entries with trademark context
router.get("/change-log", async (req, res): Promise<void> => {
  const limitRaw = parseInt(String(req.query.limit ?? '100'), 10);
  const limit = isNaN(limitRaw) || limitRaw < 1 ? 100 : Math.min(limitRaw, 500);
  const offsetRaw = parseInt(String(req.query.offset ?? '0'), 10);
  const offset = isNaN(offsetRaw) || offsetRaw < 0 ? 0 : offsetRaw;

  const logs = await db
    .select({
      id: changeLogTable.id,
      trademarkId: changeLogTable.trademarkId,
      field: changeLogTable.field,
      oldValue: changeLogTable.oldValue,
      newValue: changeLogTable.newValue,
      changedAt: changeLogTable.changedAt,
      changedBy: changeLogTable.changedBy,
      appName: trademarksTable.appName,
      tmNo: trademarksTable.tmNo,
      folderNo: trademarksTable.folderNo,
    })
    .from(changeLogTable)
    .leftJoin(trademarksTable, eq(changeLogTable.trademarkId, trademarksTable.id))
    .orderBy(desc(changeLogTable.changedAt))
    .limit(limit)
    .offset(offset);

  res.json(logs.map((log) => ({
    ...log,
    changedAt: log.changedAt ? log.changedAt.toISOString() : null,
  })));
});

// GET /trademarks/export — download all trademarks as CSV
router.get("/trademarks/export", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(trademarksTable)
    .orderBy(asc(trademarksTable.appName));

  const header = [
    'DATE', 'CASE NO', 'APP NAME', 'TM NO', 'CLASS',
    'STATUS', 'SUB STATUS', 'DUPLICATE', 'TM-11', 'NOTES', 'CITY',
    'PREFIX', 'CLIENT NO', 'FOLDER NO', 'SOURCE', 'CREATED AT',
  ];

  const escape = (val: string | null | undefined): string => {
    if (val == null) return '';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csvRows = rows.map((r) => [
    escape(r.date),
    escape(r.folderNo),
    escape(r.appName),
    escape(r.tmNo),
    escape(r.appClass),
    escape(r.stage),
    escape(r.subStage),
    r.isDuplicate ? 'TRUE' : 'FALSE',
    r.isTm11 ? 'TRUE' : 'FALSE',
    escape(r.notes),
    escape(r.city),
    escape(r.prefix),
    escape(r.clientNo),
    escape(r.folderNo),
    escape(r.source),
    r.createdAt ? r.createdAt.toISOString() : '',
  ].join(','));

  const csv = [header.join(','), ...csvRows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="trademarks.csv"');
  res.send(csv);
});

// POST /trademarks/import — bulk import from CSV body (JSON array of rows)
router.post("/trademarks/import", async (req, res): Promise<void> => {
  const csvText = typeof req.body === 'string' ? req.body : null;
  if (!csvText) {
    res.status(400).json({ error: 'Send CSV as plain text body (Content-Type: text/plain)' });
    return;
  }

  const lines = csvText.split('\n').map((l: string) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    res.json({ imported: 0, message: 'No data rows found' });
    return;
  }

  // Skip header row
  const dataLines = lines.slice(1);

  const parseCsv = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === ',' && !inQuotes) {
        result.push(cur.trim()); cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const bool = (val: string): boolean => ['true', 'yes', '1'].includes(val.toLowerCase());

  const records = [];
  for (const line of dataLines) {
    const cols = parseCsv(line);
    const appName = cols[2] ?? '';
    const tmNo = cols[3] ?? '';
    if (!appName && !tmNo) continue;

    const folderNo = cols[1] ?? null;
    const parts = folderNo ? folderNo.split('-') : [];
    const prefix = parts.length >= 3 ? parts[0] : (cols[11] || 'X');
    const clientNo = parts.length >= 3 ? parts[1] : (cols[12] || '');
    const caseNo = parts.length >= 3 ? parts[2] : '';
    const stage = cols[5] || 'STAGE 1';

    records.push({
      date: cols[0] || new Date().toISOString().split('T')[0],
      prefix,
      clientNo,
      caseNo,
      folderNo: folderNo || null,
      appName: appName || null,
      appClass: cols[4] || null,
      tmNo: tmNo || null,
      city: cols[10] || 'Islamabad',
      stage,
      subStage: cols[6] || stage,
      status: cols[6] || stage,
      isDuplicate: bool(cols[7] || ''),
      isTm11: bool(cols[8] || ''),
      notes: cols[9] || null,
      imageUrl: null,
      pdfUrl: null,
      source: 'local' as const,
      updatedAt: new Date(),
    });
  }

  let imported = 0;
  let skipped = 0;
  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100);
    try {
      await db.insert(trademarksTable).values(batch);
      imported += batch.length;
    } catch {
      for (const record of batch) {
        try {
          await db.insert(trademarksTable).values(record);
          imported++;
        } catch {
          skipped++;
        }
      }
    }
  }

  res.json({
    imported,
    skipped,
    message: `Imported ${imported} records${skipped > 0 ? `; skipped ${skipped}` : ''}`,
  });
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
      subStage: cell(row, COL.subStage) || stage || 'STAGE 1',
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
  for (let start = 0; start < records.length; start += 100) {
    const batch = records.slice(start, start + 100);
    try {
      await db.insert(trademarksTable).values(batch);
      synced += batch.length;
    } catch {
      for (const record of batch) {
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

// ─── GET /trademarks/check-duplicate?tmNo=xxx ────────────────────────────────
router.get("/trademarks/check-duplicate", async (req, res): Promise<void> => {
  const tmNo = typeof req.query.tmNo === "string" ? req.query.tmNo.trim() : "";
  if (!tmNo) { res.json({ duplicate: false }); return; }

  const rows = await db
    .select()
    .from(trademarksTable)
    .where(ilike(trademarksTable.tmNo, tmNo))
    .limit(1);

  if (rows.length === 0) {
    res.json({ duplicate: false });
  } else {
    const r = rows[0];
    res.json({
      duplicate: true,
      record: {
        id: r.id,
        tmNo: r.tmNo,
        appName: r.appName,
        stage: r.stage,
        clientNo: r.clientNo,
        caseNo: r.caseNo,
      },
    });
  }
});

// ─── GET /trademarks/monthly-stats ────────────────────────────────────────────
router.get("/trademarks/monthly-stats", async (_req, res): Promise<void> => {
  try {
    const rows = await db.execute(sql`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') AS month,
        stage,
        COUNT(*)::int AS count
      FROM trademarks
      WHERE created_at IS NOT NULL
      GROUP BY month, stage
      ORDER BY month ASC
    `);
    res.json(rows.rows ?? rows);
  } catch (err) {
    logger.error(`monthly-stats error: ${err}`);
    res.status(500).json({ error: "Failed to compute monthly stats" });
  }
});

// ─── POST /trademarks/import-csv ──────────────────────────────────────────────
router.post("/trademarks/import-csv", async (req, res): Promise<void> => {
  const { rows } = req.body as { rows: any[] };
  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: "rows array is required" });
    return;
  }

  try {
    const inserted = await db
      .insert(trademarksTable)
      .values(
        rows.map((r) => ({
          date: r.date ?? new Date().toISOString().split("T")[0],
          prefix: r.prefix ?? "TM",
          clientNo: r.clientNo ?? r.client_no ?? "IMPORT",
          caseNo: r.caseNo ?? r.case_no ?? "IMPORT",
          appName: r.appName ?? r.app_name ?? "",
          appClass: r.appClass ?? r.app_class ?? null,
          tmNo: r.tmNo ?? r.tm_no ?? null,
          city: r.city ?? "Unknown",
          stage: r.stage ?? "Application Filed",
          subStage: r.subStage ?? r.sub_stage ?? r.stage ?? "Pending",
          status: r.status ?? "Active",
          notes: r.notes ?? null,
          source: "local" as const,
          updatedAt: new Date(),
        })),
      )
      .returning({ id: trademarksTable.id });

    res.json({ synced: inserted.length, message: `${inserted.length} records imported` });
  } catch (err) {
    logger.error(`CSV import error: ${err}`);
    res.status(500).json({ error: "Import failed" });
  }
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
        newValue: newValue !== undefined && newValue !== null ? String(newValue) : "",
        changedBy: "system",
      });
    }
  }

  const sheetsWritebackUrl = process.env.GOOGLE_SHEETS_APPS_SCRIPT_URL;
  if (!sheetsWritebackUrl) {
    logger.warn({ trademarkId: row.id }, "Database updated; Sheets write-back is not configured");
  } else {
    try {
      const writeback = await fetch(sheetsWritebackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateTrademark",
          trademark: {
            id: row.id,
            originalTmNo: currentRow.tmNo,
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
      const responseText = await writeback.text();
      let result: { ok?: boolean; success?: boolean; error?: string } = {};
      try {
        result = JSON.parse(responseText) as typeof result;
      } catch {
        result = { ok: /success|updated/i.test(responseText) };
      }
      if (!writeback.ok || !(result.ok === true || result.success === true)) {
        logger.error({ status: writeback.status, result }, "Google Sheets write-back failed");
        logger.warn({ trademarkId: row.id }, "Database updated; Sheets write-back needs attention");
      }
    } catch (err) {
      logger.error({ err }, "Google Sheets write-back request failed");
      logger.warn({ trademarkId: row.id }, "Database updated; Sheets write-back request needs retry");
    }
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

// Move a record between the local database and the Sheets-backed registry.
router.post("/trademarks/:id/transfer", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const target = req.body?.target;
  if (target !== "local" && target !== "sheets") {
    res.status(400).json({ error: "target must be local or sheets" });
    return;
  }
  const [current] = await db.select().from(trademarksTable).where(eq(trademarksTable.id, id)).limit(1);
  if (!current) {
    res.status(404).json({ error: "Trademark not found" });
    return;
  }
  if (target === "sheets") {
    const sheetsWritebackUrl = process.env.GOOGLE_SHEETS_APPS_SCRIPT_URL;
    if (!sheetsWritebackUrl) {
      res.status(503).json({ error: "Google Sheets write-back is not configured." });
      return;
    }
    const writeback = await fetch(sheetsWritebackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsertTrademark",
        trademark: current,
        auditLog: { trademarkId: current.id, action: "TRANSFER_TO_SHEETS" },
      }),
    });
    const text = await writeback.text();
    let result: { ok?: boolean; success?: boolean; error?: string } = {};
    try { result = JSON.parse(text) as typeof result; } catch {}
    if (!writeback.ok || !(result.ok || result.success)) {
      res.status(502).json({ error: result.error ?? "Could not copy record to Google Sheets." });
      return;
    }
  }
  const [row] = await db.update(trademarksTable)
    .set({ source: target, updatedAt: new Date() })
    .where(eq(trademarksTable.id, id))
    .returning();
  res.json({ ...row, source: target, message: `Record marked as ${target === "sheets" ? "SHEET RECORD" : "DATABASE RECORD"}` });
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

