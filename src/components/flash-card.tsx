"use client";

import { cn } from "@/lib/utils";
import type { StudyCard } from "@/lib/study";

type FlashCardProps = {
  card: StudyCard;
  isFlipped: boolean;
  onFlip: () => void;
};

export function FlashCard({ card, isFlipped, onFlip }: FlashCardProps) {
  return (
    <div className="min-h-64 [perspective:1000px]">
      <button
        type="button"
        onClick={onFlip}
        aria-expanded={isFlipped}
        aria-label={isFlipped ? "Show front of card" : "Reveal answer"}
        className={cn(
          "relative min-h-64 w-full [transform-style:preserve-3d] motion-safe:transition-transform motion-safe:duration-500",
          isFlipped && "[transform:rotateY(180deg)]",
        )}
      >
        {/* Front */}
        <div className="bg-card ring-foreground/10 absolute inset-0 flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl p-8 text-center ring-1 [backface-visibility:hidden]">
          <p className="text-xl font-medium break-words whitespace-pre-wrap sm:text-2xl">
            {card.front}
          </p>
          <p className="text-muted-foreground text-xs">Tap to reveal</p>
        </div>

        {/* Back */}
        <div className="bg-card ring-foreground/10 absolute inset-0 flex min-h-64 [transform:rotateY(180deg)] flex-col items-center justify-center gap-3 rounded-xl p-8 text-center ring-1 [backface-visibility:hidden]">
          <p className="text-xl font-medium break-words whitespace-pre-wrap sm:text-2xl">
            {card.back}
          </p>
          {card.example ? (
            <p className="text-muted-foreground text-sm break-words whitespace-pre-wrap italic">
              {card.example}
            </p>
          ) : null}
        </div>
      </button>
    </div>
  );
}
