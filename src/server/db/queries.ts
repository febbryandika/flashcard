import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { cards, decks } from "@/server/db/schema";

/** Deck list with per-deck stats in one grouped query (no N+1). */
export async function getDecksWithStats(userId: string) {
  return db
    .select({
      id: decks.id,
      name: decks.name,
      description: decks.description,
      language: decks.language,
      createdAt: decks.createdAt,
      totalCards: count(cards.id),
      dueToday:
        sql<number>`count(${cards.id}) filter (where ${cards.nextReviewAt} <= now())`.mapWith(
          Number,
        ),
    })
    .from(decks)
    .leftJoin(cards, eq(cards.deckId, decks.id))
    .where(eq(decks.userId, userId))
    .groupBy(decks.id)
    .orderBy(desc(decks.createdAt));
}

export async function getUserDeck(deckId: string, userId: string) {
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1);

  return deck ?? null;
}
