"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { cards } from "@/server/db/schema";
import { cardInput, csvImportRows } from "@/lib/validators";
import { getUserCard, getUserDeck } from "@/server/db/queries";
import { requireUser } from "@/server/lib/require-user";

export type CardValues = { front: string; back: string; example: string };

/**
 * React resets an uncontrolled form after every action, including failed ones.
 * `attempt` re-keys the form so it remounts with `values` (typed input kept on
 * error) or with empty defaults (cleared on success).
 */
export type CardFormState = {
  error: string | null;
  attempt: number;
  values?: CardValues;
};

function readValues(formData: FormData): CardValues {
  return {
    front: String(formData.get("front") ?? ""),
    back: String(formData.get("back") ?? ""),
    example: String(formData.get("example") ?? ""),
  };
}

/** Card counts show on the deck list, so both routes go stale on any write. */
function revalidateDeck(deckId: string) {
  revalidatePath(`/decks/${deckId}`);
  revalidatePath("/decks");
}

export async function createCard(
  deckId: string,
  prevState: CardFormState,
  formData: FormData,
): Promise<CardFormState> {
  const attempt = prevState.attempt + 1;
  const user = await requireUser();

  const deck = await getUserDeck(deckId, user.id);
  if (!deck) {
    return { error: "Deck not found.", attempt, values: readValues(formData) };
  }

  const parsed = cardInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0].message,
      attempt,
      values: readValues(formData),
    };
  }

  await db.insert(cards).values({ ...parsed.data, deckId });

  revalidateDeck(deckId);
  return { error: null, attempt };
}

export async function updateCard(
  cardId: string,
  prevState: CardFormState,
  formData: FormData,
): Promise<CardFormState> {
  const attempt = prevState.attempt + 1;
  const user = await requireUser();

  const card = await getUserCard(cardId, user.id);
  if (!card) {
    return { error: "Card not found.", attempt, values: readValues(formData) };
  }

  const parsed = cardInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0].message,
      attempt,
      values: readValues(formData),
    };
  }

  await db.update(cards).set(parsed.data).where(eq(cards.id, card.id));

  revalidateDeck(card.deckId);
  redirect(`/decks/${card.deckId}`);
}

export async function deleteCard(cardId: string) {
  const user = await requireUser();

  const card = await getUserCard(cardId, user.id);
  if (!card) return;

  await db.delete(cards).where(eq(cards.id, card.id));

  revalidateDeck(card.deckId);
}

export type ImportResult = { error: string | null; imported: number };

/**
 * Batch insert from the CSV importer. Rows are parsed client-side by Papa
 * Parse, so they are re-validated here against the same schema as manual
 * entry — the client's filtering is a convenience, not a trust boundary.
 */
export async function importCards(
  deckId: string,
  rows: unknown,
): Promise<ImportResult> {
  const user = await requireUser();

  const deck = await getUserDeck(deckId, user.id);
  if (!deck) return { error: "Deck not found.", imported: 0 };

  const parsed = csvImportRows.safeParse(rows);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, imported: 0 };
  }

  await db.insert(cards).values(parsed.data.map((row) => ({ ...row, deckId })));

  revalidateDeck(deckId);
  return { error: null, imported: parsed.data.length };
}
