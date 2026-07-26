import { describe, expect, it } from "vitest";
import Papa from "papaparse";
import { validateCsvRows, toImportPayload } from "@/lib/csv";
import { CSV_ROW_LIMIT, csvImportRows } from "@/lib/validators";

/** Parses exactly as the importer does in the browser. */
function parse(csv: string) {
  return Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  }).data;
}

describe("validateCsvRows", () => {
  it("accepts well-formed rows and numbers them from line 2", () => {
    const rows = validateCsvRows(
      parse("front,back,example\nder Hund,the dog,Der Hund bellt.\n"),
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      rowNumber: 2,
      front: "der Hund",
      back: "the dog",
      example: "Der Hund bellt.",
      status: "valid",
    });
  });

  it("flags each way a row can be incomplete", () => {
    const rows = validateCsvRows(
      parse("front,back\nok,fine\n,no front\nno back,\n,\n"),
    );

    expect(
      rows.map((r) => (r.status === "invalid" ? r.reason : "valid")),
    ).toEqual([
      "valid",
      "Missing front",
      "Missing back",
      "Missing front and back",
    ]);
  });

  it("flags over-long fields, including example", () => {
    const long = "a".repeat(1001);
    const rows = validateCsvRows([
      { front: long, back: "b", example: "" },
      { front: "a", back: long, example: "" },
      { front: "a", back: "b", example: long },
    ]);

    expect(
      rows.map((r) => (r.status === "invalid" ? r.reason : "valid")),
    ).toEqual(["Front too long", "Back too long", "Example too long"]);
  });

  it("keeps the first 500 valid rows and flags the overflow", () => {
    const data = Array.from({ length: CSV_ROW_LIMIT + 5 }, (_, i) => ({
      front: `word${i}`,
      back: `meaning${i}`,
      example: "",
    }));

    const rows = validateCsvRows(data);
    const valid = rows.filter((r) => r.status === "valid");
    const overflow = rows.filter(
      (r) => r.status === "invalid" && r.reason.includes("limit"),
    );

    expect(valid).toHaveLength(CSV_ROW_LIMIT);
    expect(overflow).toHaveLength(5);
    expect(rows[CSV_ROW_LIMIT].status).toBe("invalid");
  });

  it("does not let invalid rows consume the row budget", () => {
    const data = [
      { front: "", back: "", example: "" },
      ...Array.from({ length: CSV_ROW_LIMIT }, (_, i) => ({
        front: `w${i}`,
        back: `m${i}`,
        example: "",
      })),
    ];

    expect(
      validateCsvRows(data).filter((r) => r.status === "valid"),
    ).toHaveLength(CSV_ROW_LIMIT);
  });
});

describe("importer payload is accepted by the server schema", () => {
  // Regression: the importer sends example: null for blank cells. The server
  // schema once required a string, so any CSV with a blank example failed the
  // entire batch with "expected string, received null".
  it("round-trips a CSV with blank examples through csvImportRows", () => {
    const csv =
      "front,back,example\nder Hund,the dog,Der Hund bellt.\ndie Katze,the cat,\n";
    const payload = toImportPayload(validateCsvRows(parse(csv)));

    expect(payload).toEqual([
      { front: "der Hund", back: "the dog", example: "Der Hund bellt." },
      { front: "die Katze", back: "the cat", example: null },
    ]);
    expect(csvImportRows.safeParse(payload).success).toBe(true);
  });

  it("excludes invalid rows so the batch always validates", () => {
    const csv = "front,back\nok,fine\n,broken\nalso,good\n";
    const payload = toImportPayload(validateCsvRows(parse(csv)));

    expect(payload).toHaveLength(2);
    expect(csvImportRows.safeParse(payload).success).toBe(true);
  });

  it("produces a payload at the cap that the server still accepts", () => {
    const data = Array.from({ length: CSV_ROW_LIMIT + 10 }, (_, i) => ({
      front: `w${i}`,
      back: `m${i}`,
      example: "",
    }));
    const payload = toImportPayload(validateCsvRows(data));

    expect(payload).toHaveLength(CSV_ROW_LIMIT);
    expect(csvImportRows.safeParse(payload).success).toBe(true);
  });
});
