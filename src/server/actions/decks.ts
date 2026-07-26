"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { decks } from "@/server/db/schema";
import { deckInput } from "@/lib/validators";
import { requireUser } from "@/server/lib/require-user";

export type DeckFormState = { error: string | null };

export async function createDeck(
  _prevState: DeckFormState,
  formData: FormData,
): Promise<DeckFormState> {
  const user = await requireUser();

  const parsed = deckInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.insert(decks).values({ ...parsed.data, userId: user.id });

  revalidatePath("/decks");
  redirect("/decks");
}

export async function updateDeck(
  deckId: string,
  _prevState: DeckFormState,
  formData: FormData,
): Promise<DeckFormState> {
  const user = await requireUser();

  const parsed = deckInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const updated = await db
    .update(decks)
    .set(parsed.data)
    .where(and(eq(decks.id, deckId), eq(decks.userId, user.id)))
    .returning({ id: decks.id });

  if (updated.length === 0) {
    return { error: "Deck not found." };
  }

  revalidatePath("/decks");
  redirect("/decks");
}

/** Cards are removed by the deck_id foreign key cascade. */
export async function deleteDeck(deckId: string) {
  const user = await requireUser();

  await db
    .delete(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, user.id)));

  revalidatePath("/decks");
}
