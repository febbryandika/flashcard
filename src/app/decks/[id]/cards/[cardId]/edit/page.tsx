import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardForm } from "@/components/card-form";
import { updateCard } from "@/server/actions/cards";
import { getUserCard } from "@/server/db/queries";
import { requireUser } from "@/server/lib/require-user";

export default async function EditCardPage({
  params,
}: {
  params: Promise<{ id: string; cardId: string }>;
}) {
  const { id, cardId } = await params;
  const user = await requireUser();
  const card = await getUserCard(cardId, user.id);

  if (!card || card.deckId !== id) notFound();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit card</CardTitle>
        </CardHeader>
        <CardContent>
          <CardForm
            action={updateCard.bind(null, card.id)}
            card={card}
            submitLabel="Save changes"
            pendingLabel="Saving…"
            cancelHref={`/decks/${id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
