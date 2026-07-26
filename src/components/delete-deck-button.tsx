"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { deleteDeck } from "@/server/actions/decks";

function DeleteSubmitButton({ deckName }: { deckName: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={`Delete ${deckName}`}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}

export function DeleteDeckButton({
  deckId,
  deckName,
}: {
  deckId: string;
  deckName: string;
}) {
  return (
    <form
      action={deleteDeck.bind(null, deckId)}
      onSubmit={(event) => {
        if (!confirm(`Delete "${deckName}"? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <DeleteSubmitButton deckName={deckName} />
    </form>
  );
}
