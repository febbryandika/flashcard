import { and, count, desc, eq, lte, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { cards, decks } from "@/server/db/schema";
import { previewIntervals } from "@/server/lib/fsrs";
import type { StudyCard } from "@/lib/study";

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

export async function getDeckCards(deckId: string) {
  return db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deckId))
    .orderBy(desc(cards.id));
}

/**
 * Cards due now, oldest first — every deck the user owns, or one deck when
 * `deckId` is given. Interval previews are attached here so the scheduler
 * stays server-side (SPEC §7).
 */
export async function getDueStudyCards(
  userId: string,
  deckId?: string,
): Promise<StudyCard[]> {
  const scope = deckId
    ? and(eq(decks.userId, userId), eq(cards.deckId, deckId))
    : eq(decks.userId, userId);

  const rows = await db
    .select({
      id: cards.id,
      deckId: cards.deckId,
      deckName: decks.name,
      front: cards.front,
      back: cards.back,
      example: cards.example,
      stability: cards.stability,
      difficulty: cards.difficulty,
      repetitions: cards.repetitions,
      interval: cards.interval,
    })
    .from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(and(scope, lte(cards.nextReviewAt, new Date())))
    .orderBy(cards.nextReviewAt);

  return rows.map(
    ({ stability, difficulty, repetitions, interval, ...card }) => ({
      ...card,
      previews: previewIntervals({
        stability: Number(stability),
        difficulty: Number(difficulty),
        repetitions,
        interval,
      }),
    }),
  );
}

/** Joins through the deck so a card is only ever readable by its owner. */
export async function getUserCard(cardId: string, userId: string) {
  const [row] = await db
    .select({ card: cards })
    .from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(and(eq(cards.id, cardId), eq(decks.userId, userId)))
    .limit(1);

  return row?.card ?? null;
}

export async function getUserDeck(deckId: string, userId: string) {
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1);

  return deck ?? null;
}
