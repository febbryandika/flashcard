"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { deleteCard } from "@/server/actions/cards";

function DeleteSubmitButton({ cardFront }: { cardFront: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-busy={pending}
      aria-label={`Delete card "${cardFront}"`}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}

export function DeleteCardButton({
  cardId,
  cardFront,
}: {
  cardId: string;
  cardFront: string;
}) {
  const preview =
    cardFront.length > 40 ? `${cardFront.slice(0, 40)}…` : cardFront;

  return (
    <form
      action={deleteCard.bind(null, cardId)}
      onSubmit={(event) => {
        if (!confirm(`Delete card "${preview}"? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <DeleteSubmitButton cardFront={cardFront} />
    </form>
  );
}
