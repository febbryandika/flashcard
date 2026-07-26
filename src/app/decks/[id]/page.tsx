import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { CardForm } from "@/components/card-form";
import { DeleteCardButton } from "@/components/delete-card-button";
import { createCard } from "@/server/actions/cards";
import { getDeckCards, getUserDeck } from "@/server/db/queries";
import { requireUser } from "@/server/lib/require-user";

export default async function DeckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const deck = await getUserDeck(id, user.id);

  if (!deck) notFound();

  const cards = await getDeckCards(deck.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/decks"
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          ← All decks
        </Link>
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{deck.name}</h1>
          {deck.description ? (
            <p className="text-muted-foreground text-sm">{deck.description}</p>
          ) : null}
          <p className="text-muted-foreground mt-1 text-sm">
            {cards.length} {cards.length === 1 ? "card" : "cards"}
          </p>
        </header>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="font-heading text-base leading-snug font-medium">
              Add card
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardForm
            action={createCard.bind(null, deck.id)}
            submitLabel="Add card"
            pendingLabel="Adding…"
          />
        </CardContent>
      </Card>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12 text-center">
          <h2 className="font-medium">No cards yet</h2>
          <p className="text-muted-foreground text-sm">
            Add your first card above to start studying.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {cards.map((card) => (
            <Card key={card.id}>
              <CardContent className="flex flex-col gap-2">
                <div>
                  <p className="text-muted-foreground text-xs">Front</p>
                  <p className="break-words whitespace-pre-wrap">
                    {card.front}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Back</p>
                  <p className="text-muted-foreground break-words whitespace-pre-wrap">
                    {card.back}
                  </p>
                </div>
                {card.example ? (
                  <p className="text-muted-foreground/80 text-sm break-words whitespace-pre-wrap italic">
                    {card.example}
                  </p>
                ) : null}
              </CardContent>
              <CardFooter className="justify-between">
                <Link
                  href={`/decks/${deck.id}/cards/${card.id}/edit`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Edit
                </Link>
                <DeleteCardButton cardId={card.id} cardFront={card.front} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
