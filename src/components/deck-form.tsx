"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DeckFormState } from "@/server/actions/decks";

type DeckFormProps = {
  action: (state: DeckFormState, formData: FormData) => Promise<DeckFormState>;
  deck?: { name: string; description: string | null; language: string | null };
  submitLabel: string;
  pendingLabel: string;
};

export function DeckForm({
  action,
  deck,
  submitLabel,
  pendingLabel,
}: DeckFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          maxLength={100}
          defaultValue={deck?.name}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={500}
          defaultValue={deck?.description ?? undefined}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="language">Language</Label>
        <Input
          id="language"
          name="language"
          maxLength={50}
          placeholder="Spanish"
          defaultValue={deck?.language ?? undefined}
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
        <Link
          href="/decks"
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
