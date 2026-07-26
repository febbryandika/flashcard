"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchJson, HttpError } from "@/lib/http";
import { importCards } from "@/server/actions/cards";
import { AI_CARD_MAX, AI_TEXT_MAX } from "@/lib/validators";

type ExtractedCard = { front: string; back: string; selected: boolean };

export function AiExtractor({ deckId }: { deckId: string }) {
  const id = useId();
  const textareaId = `${id}-ai-text`;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [text, setText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [cards, setCards] = useState<ExtractedCard[]>([]);
  const [addError, setAddError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedCount = cards.filter((card) => card.selected).length;
  const allSelected = cards.length > 0 && selectedCount === cards.length;
  const someSelected = selectedCount > 0 && selectedCount < cards.length;

  function runExtract() {
    setExtractError(null);
    setIsExtracting(true);

    fetchJson<{ cards: { front: string; back: string }[] }>(
      "/api/ai/extract-cards",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      },
    )
      .then((data) => {
        setCards(data.cards.map((card) => ({ ...card, selected: true })));
        setAddError(null);
        setSuccessMessage(null);
      })
      .catch((error: unknown) => {
        if (error instanceof HttpError && error.status === 401) {
          router.push("/sign-in");
          return;
        }
        setExtractError(
          error instanceof HttpError ? error.message : "Extraction failed.",
        );
      })
      .finally(() => {
        setIsExtracting(false);
      });
  }

  function handleExtractClick() {
    if (text.trim().length === 0 || isExtracting) return;
    runExtract();
  }

  function toggleAll(checked: boolean) {
    setCards(cards.map((card) => ({ ...card, selected: checked })));
  }

  function toggleOne(index: number, checked: boolean) {
    setCards(
      cards.map((card, i) =>
        i === index ? { ...card, selected: checked } : card,
      ),
    );
  }

  function handleClear() {
    setText("");
    setCards([]);
    setExtractError(null);
    setAddError(null);
    setSuccessMessage(null);
  }

  function handleAddSelected() {
    setAddError(null);
    setSuccessMessage(null);

    const selected = cards.filter((card) => card.selected);

    startTransition(async () => {
      const result = await importCards(
        deckId,
        selected.map((card) => ({
          front: card.front,
          back: card.back,
          example: null,
        })),
      );

      if (result.error) {
        setAddError(result.error);
        return;
      }

      setSuccessMessage(`Added ${result.imported} cards.`);
      setCards([]);
      setText("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={textareaId}>Text</Label>
        <Textarea
          id={textareaId}
          rows={6}
          maxLength={AI_TEXT_MAX}
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={isExtracting}
        />
        <p className="text-muted-foreground text-sm">
          {text.length} / {AI_TEXT_MAX}
        </p>
        <p className="text-muted-foreground text-sm">
          Up to {AI_CARD_MAX} cards will be extracted.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={handleExtractClick}
          disabled={text.trim().length === 0 || isExtracting}
        >
          {isExtracting ? "Extracting…" : "Extract cards"}
        </Button>
        {isExtracting ? (
          <p className="text-muted-foreground text-sm">
            This can take a few seconds…
          </p>
        ) : null}
      </div>

      {extractError ? (
        <div className="flex items-center gap-3">
          <p className="text-destructive text-sm" aria-live="polite">
            {extractError}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={runExtract}
            disabled={isExtracting}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {cards.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <caption className="sr-only">AI-extracted card preview</caption>
              <thead>
                <tr className="border-b text-left">
                  <th className="px-2.5 py-1.5 font-medium" scope="col">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onCheckedChange={(checked) => toggleAll(checked)}
                      aria-label="Select all cards"
                    />
                  </th>
                  <th className="px-2.5 py-1.5 font-medium" scope="col">
                    Front
                  </th>
                  <th className="px-2.5 py-1.5 font-medium" scope="col">
                    Back
                  </th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="px-2.5 py-1.5">
                      <Checkbox
                        checked={card.selected}
                        onCheckedChange={(checked) => toggleOne(index, checked)}
                        aria-label={`Select card: ${card.front}`}
                      />
                    </td>
                    <td
                      className="max-w-[16rem] truncate px-2.5 py-1.5"
                      title={card.front}
                    >
                      {card.front}
                    </td>
                    <td
                      className="max-w-[16rem] truncate px-2.5 py-1.5"
                      title={card.back}
                    >
                      {card.back}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm">
            {selectedCount} of {cards.length} selected
          </p>

          {addError ? (
            <p className="text-destructive text-sm" aria-live="polite">
              {addError}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleAddSelected}
              disabled={selectedCount === 0 || isPending}
            >
              {isPending ? "Adding…" : "Add selected cards"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isExtracting || isPending}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={isExtracting || isPending}
          >
            Clear
          </Button>
        </div>
      )}

      {successMessage ? (
        <p className="text-sm" aria-live="polite">
          {successMessage}
        </p>
      ) : null}
    </div>
  );
}
