"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signInWithReturnTo } from "@/lib/return-to";
import { useMutation } from "@tanstack/react-query";
import { FlashCard } from "@/components/flash-card";
import { RatingBar } from "@/components/rating-bar";
import { Button, buttonVariants } from "@/components/ui/button";
import { HttpError, fetchJson } from "@/lib/http";
import { useStudyStore } from "@/stores/study-store";
import type { StudyCard } from "@/lib/study";

type StudySessionProps = {
  cards: StudyCard[];
  title: string;
  backHref: string;
  backLabel: string;
};

type ReviewResult = { nextReviewAt: string; interval: number };

type RateVariables = { cardId: string; rating: 1 | 2 | 3 | 4; from: number };

export function StudySession({
  cards,
  title,
  backHref,
  backLabel,
}: StudySessionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);
  const [lastRating, setLastRating] = useState<RateVariables | null>(null);

  const start = useStudyStore((s) => s.start);
  const flip = useStudyStore((s) => s.flip);
  const advance = useStudyStore((s) => s.advance);
  const back = useStudyStore((s) => s.back);
  const queue = useStudyStore((s) => s.queue);
  const index = useStudyStore((s) => s.index);
  const isFlipped = useStudyStore((s) => s.isFlipped);

  useEffect(() => {
    start(cards);
  }, [cards, start]);

  const mutation = useMutation({
    mutationFn: ({ cardId, rating }: RateVariables) =>
      fetchJson<ReviewResult>(`/api/cards/${cardId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      }),
    onError: (err, variables) => {
      if (err instanceof HttpError && err.status === 401) {
        router.push(signInWithReturnTo(pathname));
        return;
      }
      back(variables.from);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    },
    onSuccess: () => {
      setError(null);
    },
  });

  // The store is module-global and outlives the page, so on a fresh session it
  // still holds the previous queue until the effect above runs. start() assigns
  // the same array reference, making this an exact "synced yet?" check —
  // without it the first paint can flash the last session's completed state.
  const isReady = queue === cards;
  const total = queue.length;
  const finished = isReady && total > 0 && index >= total;
  const current = isReady ? queue[index] : undefined;

  function rate(rating: 1 | 2 | 3 | 4) {
    if (!current) return;
    const variables: RateVariables = {
      cardId: current.id,
      rating,
      from: index,
    };
    setError(null);
    setLastRating(variables);
    advance();
    mutation.mutate(variables);
  }

  function retry() {
    if (!lastRating) return;
    setError(null);
    advance();
    mutation.mutate(lastRating);
  }

  const progressCount = Math.min(index, total);
  const progressPercent = total === 0 ? 0 : (progressCount / total) * 100;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Link
          href={backHref}
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          {backLabel}
        </Link>
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-muted-foreground shrink-0 text-sm">
              {isReady && total > 0
                ? `${Math.min(index + 1, total)} of ${total}`
                : null}
            </p>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progressCount}
            aria-valuemin={0}
            aria-valuemax={total}
            className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
          >
            <div
              className="bg-primary h-full rounded-full transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </header>
      </div>

      {!isReady || total === 0 ? null : finished ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-12 text-center">
          <h2 className="text-lg font-medium">Session complete</h2>
          <p className="text-muted-foreground text-sm">
            You reviewed {total} {total === 1 ? "card" : "cards"}.
          </p>
          <Link
            href={backHref}
            className={buttonVariants({ className: "mt-2" })}
          >
            {backLabel}
          </Link>
        </div>
      ) : current ? (
        <div className="flex flex-col gap-4">
          {/* Redundant when studying a single deck — the title already says it. */}
          {current.deckName !== title ? (
            <p className="text-muted-foreground text-xs">{current.deckName}</p>
          ) : null}

          <FlashCard card={current} isFlipped={isFlipped} onFlip={flip} />

          {isFlipped ? (
            <div className="flex flex-col gap-3">
              {error ? (
                <div
                  className="flex items-center justify-between gap-3"
                  aria-live="polite"
                >
                  <p className="text-destructive text-sm">{error}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={retry}
                  >
                    Try again
                  </Button>
                </div>
              ) : null}
              <RatingBar previews={current.previews} onRate={rate} />
            </div>
          ) : (
            <p className="text-muted-foreground text-center text-sm">
              Flip the card to reveal the answer before rating.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
