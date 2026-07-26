import { z } from "zod";

/** Empty optional form fields arrive as "" from FormData — store them as NULL. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);

export const deckInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: optionalText(500),
  language: optionalText(50),
});

export type DeckInput = z.infer<typeof deckInput>;
