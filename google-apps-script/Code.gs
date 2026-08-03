/**
 * Brandex write-back bridge.
 *
 * Deploy: Deploy > New deployment > Web app
 * Execute as: Me
 * Who has access: Anyone with the link
 *
 * The API sends { action: "updateTrademark", trademark: {...}, auditLog: {...} }.
 * The script updates the row matching TM NO in the active spreadsheet and
 * appends an audit entry to the "Audit Log" sheet.
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || "{}");
    if (body.action !== "updateTrademark") {
      return json({ ok: false, error: "Unsupported action" });
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheets()[0];
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return json({ ok: false, error: "No data rows" });

    var headers = values[0].map(function (h) { return String(h).trim().toUpperCase(); });
    var tmColumn = headers.indexOf("TM NO");
    if (tmColumn < 0) return json({ ok: false, error: "TM NO column not found" });

    var trademark = body.trademark || {};
    var target = String(trademark.tmNo || "").trim();
    var rowNumber = -1;
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][tmColumn]).trim() === target) {
        rowNumber = i + 1;
        break;
      }
    }
    if (rowNumber < 0) return json({ ok: false, error: "TM NO not found" });

    var updates = {
      "DATE": trademark.date,
      "CASE NO": trademark.folderNo,
      "APP NAME": trademark.appName,
      "TM NO": trademark.tmNo,
      "CLASS": trademark.appClass,
      "STATUS": trademark.stage,
      "APPLICATION SUB STATUS": trademark.subStage,
      "DUPLICATE": trademark.isDuplicate ? "TRUE" : "FALSE",
      "TM-11": trademark.isTm11 ? "TRUE" : "FALSE",
      "NOTES": trademark.notes,
      "CITY": trademark.city
    };
    headers.forEach(function (header, index) {
      if (Object.prototype.hasOwnProperty.call(updates, header)) {
        sheet.getRange(rowNumber, index + 1).setValue(updates[header] || "");
      }
    });

    var audit = spreadsheet.getSheetByName("Audit Log") ||
      spreadsheet.insertSheet("Audit Log");
    if (audit.getLastRow() === 0) {
      audit.appendRow(["Timestamp", "TM NO", "Action", "Changed By", "Payload"]);
    }
    audit.appendRow([
      new Date(),
      target,
      "UPDATE",
      Session.getActiveUser().getEmail() || "Brandex",
      JSON.stringify(body.auditLog || {})
    ]);
    return json({ ok: true, row: rowNumber });
  } catch (error) {
    return json({ ok: false, error: String(error) });
  }
}

function json(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}