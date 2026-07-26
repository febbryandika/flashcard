import { CSV_ROW_LIMIT } from "@/lib/validators";

const CSV_FIELD_MAX = 1000;

type RowBase = {
  rowNumber: number;
  front: string;
  back: string;
  example: string | null;
};

export type ParsedRow =
  | (RowBase & { status: "valid" })
  | (RowBase & { status: "invalid"; reason: string });

/**
 * Mirrors the server rules in validators.ts (cardInput, CSV_ROW_LIMIT) so the
 * preview shows exactly what importCards will accept. Kept out of the component
 * so the rules are unit-testable — a client/server mismatch here silently
 * fails the whole batch.
 *
 * rowNumber counts the header as line 1, so the first data row is 2.
 */
export function validateCsvRows(data: Record<string, string>[]): ParsedRow[] {
  let validCount = 0;

  return data.map((raw, index) => {
    const rowNumber = index + 2;
    const front = (raw.front ?? "").trim();
    const back = (raw.back ?? "").trim();
    const example = (raw.example ?? "").trim() || null;

    let reason: string | null = null;
    if (!front && !back) {
      reason = "Missing front and back";
    } else if (!front) {
      reason = "Missing front";
    } else if (!back) {
      reason = "Missing back";
    } else if (front.length > CSV_FIELD_MAX) {
      reason = "Front too long";
    } else if (back.length > CSV_FIELD_MAX) {
      reason = "Back too long";
    } else if (example && example.length > CSV_FIELD_MAX) {
      reason = "Example too long";
    }

    if (!reason) {
      validCount++;
      if (validCount > CSV_ROW_LIMIT) {
        reason = `Over the ${CSV_ROW_LIMIT}-row limit`;
      }
    }

    return reason
      ? { rowNumber, front, back, example, status: "invalid", reason }
      : { rowNumber, front, back, example, status: "valid" };
  });
}

/** The payload sent to importCards — preview metadata stripped. */
export function toImportPayload(rows: ParsedRow[]) {
  return rows
    .filter((row) => row.status === "valid")
    .map(({ front, back, example }) => ({ front, back, example }));
}
