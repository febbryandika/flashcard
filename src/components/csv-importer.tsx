"use client";

import {
  useId,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { importCards } from "@/server/actions/cards";
import { CSV_ROW_LIMIT } from "@/lib/validators";
import { validateCsvRows, toImportPayload, type ParsedRow } from "@/lib/csv";

const PREVIEW_LIMIT = 50;

export function CsvImporter({ deckId }: { deckId: string }) {
  const id = useId();
  const fileInputId = `${id}-csv-file`;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validRows = rows.filter((row) => row.status === "valid");
  const skippedCount = rows.length - validRows.length;

  function resetParsedState() {
    setParseError(null);
    setRows([]);
    setImportError(null);
    setSuccessMessage(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    resetParsedState();

    const file = event.target.files?.[0];
    if (!file) return;

    setParsing(true);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        setParsing(false);

        const fields = results.meta.fields ?? [];
        if (!fields.includes("front") || !fields.includes("back")) {
          setParseError("CSV must have front and back columns.");
          return;
        }

        if (results.errors.length > 0) {
          setParseError(`Failed to parse CSV: ${results.errors[0].message}`);
          return;
        }

        if (results.data.length === 0) {
          setParseError("CSV has no data rows.");
          return;
        }

        setRows(validateCsvRows(results.data));
      },
      error: (error) => {
        setParsing(false);
        setParseError(`Failed to parse CSV: ${error.message}`);
      },
    });
  }

  function handleClear() {
    resetParsedState();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleImport() {
    setImportError(null);
    setSuccessMessage(null);

    const payload = toImportPayload(rows);

    startTransition(async () => {
      const result = await importCards(deckId, payload);
      if (result.error) {
        setImportError(result.error);
        return;
      }

      setSuccessMessage(`Imported ${result.imported} cards.`);
      setRows([]);
      setParseError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    });
  }

  const visibleRows = rows.slice(0, PREVIEW_LIMIT);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={fileInputId}>CSV file</Label>
        <Input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          disabled={parsing || isPending}
        />
        <p className="text-muted-foreground text-sm">
          Columns: front, back, and optionally example. Max {CSV_ROW_LIMIT}{" "}
          rows.
        </p>
      </div>

      {parsing ? (
        <p className="text-muted-foreground text-sm">Parsing…</p>
      ) : null}

      {parseError ? (
        <p className="text-destructive text-sm" aria-live="polite">
          {parseError}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <caption className="sr-only">CSV import preview</caption>
              <thead>
                <tr className="border-b text-left">
                  <th className="px-2.5 py-1.5 font-medium" scope="col">
                    #
                  </th>
                  <th className="px-2.5 py-1.5 font-medium" scope="col">
                    Front
                  </th>
                  <th className="px-2.5 py-1.5 font-medium" scope="col">
                    Back
                  </th>
                  <th className="px-2.5 py-1.5 font-medium" scope="col">
                    Example
                  </th>
                  <th className="px-2.5 py-1.5 font-medium" scope="col">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const cellClassName =
                    row.status === "invalid"
                      ? "text-muted-foreground line-through max-w-[16rem] truncate px-2.5 py-1.5"
                      : "max-w-[16rem] truncate px-2.5 py-1.5";
                  return (
                    <tr
                      key={row.rowNumber}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-2.5 py-1.5">{row.rowNumber}</td>
                      <td className={cellClassName} title={row.front}>
                        {row.front}
                      </td>
                      <td className={cellClassName} title={row.back}>
                        {row.back}
                      </td>
                      <td className={cellClassName} title={row.example ?? ""}>
                        {row.example}
                      </td>
                      <td className="px-2.5 py-1.5">
                        {row.status === "valid" ? (
                          <span className="text-muted-foreground text-xs">
                            Ready
                          </span>
                        ) : (
                          <span className="text-destructive text-xs">
                            {row.reason}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length > PREVIEW_LIMIT ? (
            <p className="text-muted-foreground text-sm">
              Showing first {PREVIEW_LIMIT} of {rows.length} rows.
            </p>
          ) : null}

          <p className="text-sm">
            {validRows.length} ready to import
            {skippedCount > 0 ? ` · ${skippedCount} skipped` : ""}
          </p>

          {importError ? (
            <p className="text-destructive text-sm" aria-live="polite">
              {importError}
            </p>
          ) : null}

          {successMessage ? (
            <p className="text-sm" aria-live="polite">
              {successMessage}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleImport}
              disabled={validRows.length === 0 || isPending}
            >
              {isPending ? "Importing…" : `Import ${validRows.length} cards`}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isPending}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : successMessage ? (
        <p className="text-sm" aria-live="polite">
          {successMessage}
        </p>
      ) : null}
    </div>
  );
}
