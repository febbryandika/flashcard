"use client";

import { useActionState, useId } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CardFormState } from "@/server/actions/cards";

// Lives here, not in the action module: a "use server" file may only export
// async functions, so a shared constant there breaks the build at runtime.
const initialState: CardFormState = { error: null, attempt: 0 };

type CardFormProps = {
  action: (state: CardFormState, formData: FormData) => Promise<CardFormState>;
  card?: { front: string; back: string; example: string | null };
  submitLabel: string;
  pendingLabel: string;
  cancelHref?: string;
};

export function CardForm({
  action,
  card,
  submitLabel,
  pendingLabel,
  cancelHref,
}: CardFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const id = useId();
  const frontId = `${id}-front`;
  const backId = `${id}-back`;
  const exampleId = `${id}-example`;

  // Remounts on every attempt: keeps typed input on error, clears on success.
  const defaults = state.values ?? {
    front: card?.front ?? "",
    back: card?.back ?? "",
    example: card?.example ?? "",
  };

  return (
    <form
      key={state.attempt}
      action={formAction}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={frontId}>Front</Label>
        <Textarea
          id={frontId}
          name="front"
          rows={2}
          maxLength={1000}
          defaultValue={defaults.front}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={backId}>Back</Label>
        <Textarea
          id={backId}
          name="back"
          rows={2}
          maxLength={1000}
          defaultValue={defaults.back}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={exampleId}>Example (optional)</Label>
        <Textarea
          id={exampleId}
          name="example"
          rows={2}
          maxLength={1000}
          defaultValue={defaults.example}
        />
      </div>
      {state.error ? (
        <p className="text-destructive text-sm" aria-live="polite">
          {state.error}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
        {cancelHref ? (
          <Link
            href={cancelHref}
            className="text-muted-foreground text-sm underline underline-offset-4"
          >
            Cancel
          </Link>
        ) : null}
      </div>
    </form>
  );
}
