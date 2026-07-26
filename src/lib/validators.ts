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

export const cardInput = z.object({
  front: z.string().trim().min(1, "Front is required").max(1000),
  back: z.string().trim().min(1, "Back is required").max(1000),
  example: optionalText(1000),
});

export type CardInput = z.infer<typeof cardInput>;
