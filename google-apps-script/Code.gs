/**
 * Brandex Google Sheets Backend
 *
 * Deploy: Deploy > New deployment > Web app
 * Execute as: Me
 * Who has access: Anyone with the link
 *
 * === SHEET STRUCTURE REQUIRED ===
 *
 * Tab 1 — "Database" (or Sheet1):
 *   Row 1 headers: ID | DATE | TYPE | CLIENT CODE | CLIENT NAME | CASE NUMBER |
 *                  APPLICATION NAME | STATUS | SUB STATUS | TM NUMBER | CLASS |
 *                  CASE TYPE | CITY | NOTES | LAST MODIFIED
 *
 * Tab 2 — "Audit Log" (exact name):
 *   Row 1 headers: Timestamp | User | Action | Record | Field | Old Value | New Value
 *
 * === API ===
 *
 * GET  ?action=list              → returns all database rows as JSON array
 * GET  ?action=stats             → returns summary statistics
 * GET  ?action=listLogs&limit=N  → returns last N audit log rows
 *
 * POST { action: "create", record: {...} }             → create new row
 * POST { action: "update", id: "...", record: {...} }  → update row by ID
 * POST { action: "delete", id: "..." }                 → delete row by ID
 */

var DB_SHEET_NAME = "Database";
var LOG_SHEET_NAME = "Audit Log";

var DB_HEADERS = [
  "ID", "DATE", "TYPE", "CLIENT CODE", "CLIENT NAME", "CASE NUMBER",
  "APPLICATION NAME", "STATUS", "SUB STATUS", "TM NUMBER", "CLASS",
  "CASE TYPE", "CITY", "NOTES", "LAST MODIFIED"
];

var LOG_HEADERS = [
  "Timestamp", "User", "Action", "Record", "Field", "Old Value", "New Value"
];

// ---------------------------------------------------------------------------
// GET handler — read-only operations
// ---------------------------------------------------------------------------
function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = params.action || "list";

    if (action === "list") {
      var rows = getDbRows();
      return json({ ok: true, data: rows });
    }

    if (action === "stats") {
      var rows = getDbRows();
      var stats = computeStats(rows);
      return json({ ok: true, data: stats });
    }

    if (action === "listLogs") {
      var limit = parseInt(params.limit || "100", 10);
      var offset = parseInt(params.offset || "0", 10);
      var logs = getLogRows(limit, offset);
      return json({ ok: true, data: logs });
    }

    return json({ ok: false, error: "Unknown GET action: " + action });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// ---------------------------------------------------------------------------
// POST handler — write operations
// ---------------------------------------------------------------------------
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || "{}");
    var action = body.action;

    if (action === "create") {
      var result = createRecord(body.record || {});
      return json({ ok: true, data: result });
    }

    if (action === "update") {
      var result = updateRecord(body.id, body.record || {});
      return json({ ok: true, data: result });
    }

    if (action === "delete") {
      deleteRecord(body.id);
      return json({ ok: true });
    }

    // Legacy compat for old upsertTrademark calls
    if (action === "upsertTrademark" || action === "updateTrademark") {
      var tm = body.trademark || {};
      var legacyRecord = {
        date: tm.date,
        prefix: tm.prefix,
        clientNo: tm.clientNo,
        clientName: tm.clientName,
        caseNo: tm.caseNo,
        folderNo: tm.folderNo,
        appName: tm.appName,
        stage: tm.stage,
        subStage: tm.subStage,
        tmNo: tm.tmNo,
        appClass: tm.appClass,
        caseType: tm.caseType,
        city: tm.city,
        notes: tm.notes,
      };

      var existing = findRowById(tm.id);
      if (existing) {
        var result = updateRecord(tm.id, legacyRecord);
        return json({ ok: true, data: result });
      } else {
        var result = createRecord(legacyRecord);
        return json({ ok: true, data: result });
      }
    }

    return json({ ok: false, error: "Unknown POST action: " + action });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// ---------------------------------------------------------------------------
// Core DB operations
// ---------------------------------------------------------------------------
function getDbSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DB_SHEET_NAME) || ss.getSheets()[0];
  // Ensure headers exist
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(DB_HEADERS);
  } else {
    var firstRow = sheet.getRange(1, 1, 1, DB_HEADERS.length).getValues()[0];
    var firstCell = String(firstRow[0]).trim();
    if (firstCell !== "ID") {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, DB_HEADERS.length).setValues([DB_HEADERS]);
    }
  }
  return sheet;
}

function getLogSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(LOG_SHEET_NAME);
    sheet.appendRow(LOG_HEADERS);
  }
  return sheet;
}

function getHeaderMap(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  headers.forEach(function (h, i) {
    map[String(h).trim().toUpperCase()] = i;
  });
  return map;
}

function getDbRows() {
  var sheet = getDbSheet();
  var last = sheet.getLastRow();
  if (last < 2) return [];

  var data = sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getValues();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  return data
    .filter(function (row) { return String(row[0]).trim() !== ""; })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) {
        var key = String(h).trim();
        var val = row[i];
        obj[key] = val instanceof Date ? val.toISOString().split("T")[0] : String(val || "");
      });
      return obj;
    });
}

function findRowById(id) {
  var sheet = getDbSheet();
  var last = sheet.getLastRow();
  if (last < 2) return null;

  var idCol = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < idCol.length; i++) {
    if (String(idCol[i][0]).trim() === String(id).trim()) {
      return { rowIndex: i + 2 }; // 1-based row
    }
  }
  return null;
}

function generateId() {
  return "BX-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
}

function createRecord(record) {
  var sheet = getDbSheet();
  var headerMap = getHeaderMap(sheet);
  var id = record.id || generateId();
  var now = new Date().toISOString();

  var row = new Array(DB_HEADERS.length).fill("");
  row[headerMap["ID"]] = id;
  row[headerMap["DATE"]] = record.date || now.split("T")[0];
  row[headerMap["TYPE"]] = record.prefix || record.type || "";
  row[headerMap["CLIENT CODE"]] = record.clientNo || "";
  row[headerMap["CLIENT NAME"]] = record.clientName || "";
  row[headerMap["CASE NUMBER"]] = record.folderNo || record.caseNo || "";
  row[headerMap["APPLICATION NAME"]] = record.appName || "";
  row[headerMap["STATUS"]] = record.stage || "";
  row[headerMap["SUB STATUS"]] = record.subStage || "";
  row[headerMap["TM NUMBER"]] = record.tmNo || "";
  row[headerMap["CLASS"]] = record.appClass || "";
  row[headerMap["CASE TYPE"]] = record.caseType || "";
  row[headerMap["CITY"]] = record.city || "";
  row[headerMap["NOTES"]] = record.notes || "";
  row[headerMap["LAST MODIFIED"]] = now;

  sheet.appendRow(row);
  appendLog("CREATE", id, record.appName || id, "CREATE", "", "CREATED", record);
  return { id: id, folderNo: row[headerMap["CASE NUMBER"]] };
}

function updateRecord(id, record) {
  var sheet = getDbSheet();
  var found = findRowById(id);
  if (!found) throw new Error("Record not found: " + id);

  var rowNum = found.rowIndex;
  var headerMap = getHeaderMap(sheet);
  var now = new Date().toISOString();

  // Read old values for audit
  var oldRow = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
  var oldRecord = {};
  DB_HEADERS.forEach(function (h, i) { oldRecord[h] = String(oldRow[headerMap[h]] || ""); });

  // Map of fields to update
  var fieldMap = {
    "DATE": record.date,
    "TYPE": record.prefix || record.type,
    "CLIENT CODE": record.clientNo,
    "CLIENT NAME": record.clientName,
    "CASE NUMBER": record.folderNo || record.caseNo,
    "APPLICATION NAME": record.appName,
    "STATUS": record.stage,
    "SUB STATUS": record.subStage,
    "TM NUMBER": record.tmNo,
    "CLASS": record.appClass,
    "CASE TYPE": record.caseType,
    "CITY": record.city,
    "NOTES": record.notes,
    "LAST MODIFIED": now,
  };

  var label = record.appName || id;

  Object.keys(fieldMap).forEach(function (header) {
    var newVal = fieldMap[header];
    if (newVal === undefined || newVal === null) return;
    var colIndex = headerMap[header];
    if (colIndex === undefined) return;
    var oldVal = oldRecord[header] || "";
    var newValStr = String(newVal);
    if (oldVal !== newValStr) {
      sheet.getRange(rowNum, colIndex + 1).setValue(newVal);
      appendLog("UPDATE", id, label, header, oldVal, newValStr, {});
    }
  });

  return { id: id };
}

function deleteRecord(id) {
  var sheet = getDbSheet();
  var found = findRowById(id);
  if (!found) throw new Error("Record not found: " + id);
  appendLog("DELETE", id, id, "DELETE", "", "DELETED", {});
  sheet.deleteRow(found.rowIndex);
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------
function appendLog(action, recordId, label, field, oldVal, newVal, payload) {
  var sheet = getLogSheet();
  var user = "Brandex";
  try { user = Session.getActiveUser().getEmail() || "Brandex"; } catch (e) {}
  sheet.appendRow([
    new Date(),
    user,
    action,
    label || recordId,
    field,
    oldVal || "",
    newVal || ""
  ]);
}

function getLogRows(limit, offset) {
  var sheet = getLogSheet();
  var last = sheet.getLastRow();
  if (last < 2) return [];

  var totalData = last - 1;
  var startRow = Math.max(2, last - offset - limit + 1);
  var numRows = Math.min(limit, last - startRow);
  if (numRows < 1) return [];

  var data = sheet.getRange(startRow, 1, numRows, 7).getValues();
  var result = [];
  for (var i = data.length - 1; i >= 0; i--) {
    var row = data[i];
    result.push({
      id: startRow + i - 1,
      changedAt: row[0] instanceof Date ? row[0].toISOString() : String(row[0]),
      changedBy: String(row[1] || ""),
      action: String(row[2] || ""),
      record: String(row[3] || ""),
      field: String(row[4] || ""),
      oldValue: String(row[5] || ""),
      newValue: String(row[6] || ""),
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------
function computeStats(rows) {
  var total = rows.length;
  var byStatus = {};
  var byCity = {};
  var stageCounts = {};
  var sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  var recentlyModified = 0;

  rows.forEach(function (row) {
    var status = row["STATUS"] || "UNKNOWN";
    byStatus[status] = (byStatus[status] || 0) + 1;

    var city = row["CITY"] || "UNSPECIFIED";
    byCity[city] = (byCity[city] || 0) + 1;

    var stage = row["STATUS"] || "";
    if (stage.match(/STAGE \d/i)) {
      stageCounts[stage.toUpperCase()] = (stageCounts[stage.toUpperCase()] || 0) + 1;
    }

    var lastMod = row["LAST MODIFIED"];
    if (lastMod) {
      var d = new Date(lastMod);
      if (!isNaN(d) && d >= sevenDaysAgo) recentlyModified++;
    }
  });

  var byStage = Object.keys(byStatus).map(function (k) { return { stage: k, count: byStatus[k] }; });
  var byCityArr = Object.keys(byCity).map(function (k) { return { city: k, count: byCity[k] }; });
  var byNumericStage = Object.keys(stageCounts).map(function (k) { return { stage: k, count: stageCounts[k] }; });

  return {
    total: total,
    recentlyModified: recentlyModified,
    byStage: byStage,
    byCity: byCityArr,
    byNumericStage: byNumericStage
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function json(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}