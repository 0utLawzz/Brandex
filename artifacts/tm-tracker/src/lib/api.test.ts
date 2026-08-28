import { describe, expect, it } from "vitest";
import { inputToRow, mapRowToRecord } from "./api";

describe("Brandex data mapping", () => {
  it("maps the 24-column Sheet format without changing legal identifiers", () => {
    const record = mapRowToRecord({
      ID: "BX-1",
      DATE: "2026-08-28",
      TYPE: "X",
      "CLIENT CODE": "C-7",
      "CASE NUMBER": "CASE-9",
      "CLIENT NAME": "Client",
      "APPLICATION NAME": "BRANDEX",
      "TM/CPR NUMBER": "12345",
      CLASS: "35, 42",
      STATUS: "STAGE 2",
      "SUB STATUS": "Assigned",
      "CASE TYPE": "Trademark",
      AGENT: "Counsel",
      CITY: "Islamabad",
      NOTES: "Priority",
      TM5: "YES",
      TM6: "",
      TM11: "",
      TM16: "",
      TM56: "",
      "JOURNAL NUMBER": "J-1",
      "JOURNAL DATE": "2026-08-01",
      "LAST MODIFIED": "2026-08-28T10:00:00Z",
      IMAGE: "drive-file-id",
    });

    expect(record.id).toBe("BX-1");
    expect(record.caseNumber).toBe("CASE-9");
    expect(record.appClass).toBe("35, 42");
    expect(record.tm5).toBe("YES");
  });

  it("separates private storage paths from legacy external image URLs", () => {
    expect(inputToRow({ image: "pending/user/logo.png" })).toMatchObject({
      logo_path: "pending/user/logo.png",
      legacy_image_url: null,
    });
    expect(inputToRow({ image: "https://drive.google.com/logo" })).toMatchObject({
      logo_path: null,
      legacy_image_url: "https://drive.google.com/logo",
    });
    expect(inputToRow({ image: "" })).toMatchObject({
      logo_path: null,
      legacy_image_url: null,
    });
  });
});
