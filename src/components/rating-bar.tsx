"use client";

import { Button } from "@/components/ui/button";
import { RATINGS, formatInterval, type StudyCard } from "@/lib/study";

type RatingBarProps = {
  previews: StudyCard["previews"];
  onRate: (rating: 1 | 2 | 3 | 4) => void;
  disabled?: boolean;
};

export function RatingBar({ previews, onRate, disabled }: RatingBarProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {RATINGS.map((rating) => (
        <Button
          key={rating.value}
          type="button"
          variant={rating.value === 1 ? "outline" : "default"}
          disabled={disabled}
          onClick={() => onRate(rating.value)}
          className="flex h-auto min-h-16 flex-col gap-0.5"
        >
          <span>{rating.label}</span>
          <span className="text-xs opacity-70">
            {formatInterval(previews[rating.value])}
          </span>
        </Button>
      ))}
    </div>
  );
}
