import { NextRequest, NextResponse } from "next/server";
import { withRequestLogging } from "@/server/lib/request-log";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { cards } from "@/server/db/schema";
import { getUserCard } from "@/server/db/queries";
import { fsrs, type Rating } from "@/server/lib/fsrs";
import { getApiUser, jsonError } from "@/server/lib/api";
import { ratingInput } from "@/lib/validators";

async function handlePOST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getApiUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = ratingInput.safeParse(body);
  if (!parsed.success) {
    return jsonError("Rating must be 1, 2, 3, or 4", 400);
  }

  const card = await getUserCard(id, user.id);
  if (!card) return jsonError("Not found", 404);

  const updated = fsrs(
    {
      stability: Number(card.stability),
      difficulty: Number(card.difficulty),
      repetitions: card.repetitions,
      interval: card.interval,
    },
    parsed.data.rating as Rating,
  );

  await db
    .update(cards)
    .set({
      stability: String(updated.stability),
      difficulty: String(updated.difficulty),
      repetitions: updated.repetitions,
      interval: updated.interval,
      nextReviewAt: updated.nextReviewAt,
      lastReviewAt: new Date(),
    })
    .where(eq(cards.id, card.id));

  return NextResponse.json({
    nextReviewAt: updated.nextReviewAt,
    interval: updated.interval,
  });
}

export const POST = withRequestLogging(handlePOST);
