import { z } from "zod";

/**
 * Optional text from either source: FormData sends "" for an empty field,
 * while JSON payloads (the CSV importer) send null. Both store as NULL.
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => value || null);

export const deckInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: optionalText(500),
  language: optionalText(50),
});

export type DeckInput = z.infer<typeof deckInput>;

export const cardInput = z.object({
  front: z.string().trim().min(1, "Front is required").max(1000),
  back: z.string().trim().min(1, "Back is required").max(1000),
  example: optionalText(1000),
});

export type CardInput = z.infer<typeof cardInput>;

/** CSV rows reuse cardInput, so imports obey the same rules as manual entry. */
export const CSV_ROW_LIMIT = 500;

export const csvImportRows = z
  .array(cardInput)
  .min(1, "No valid rows to import")
  .max(CSV_ROW_LIMIT, `Cannot import more than ${CSV_ROW_LIMIT} rows at once`);

/** Again=1, Hard=2, Good=3, Easy=4 — the only values a client may submit. */
export const ratingInput = z.object({
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

export type RatingInput = z.infer<typeof ratingInput>;
