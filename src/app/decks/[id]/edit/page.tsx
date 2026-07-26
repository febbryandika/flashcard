import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeckForm } from "@/components/deck-form";
import { updateDeck } from "@/server/actions/decks";
import { getUserDeck } from "@/server/db/queries";
import { requireUser } from "@/server/lib/require-user";

export default async function EditDeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const deck = await getUserDeck(id, user.id);

  if (!deck) notFound();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit deck</CardTitle>
        </CardHeader>
        <CardContent>
          <DeckForm
            action={updateDeck.bind(null, deck.id)}
            deck={deck}
            submitLabel="Save changes"
            pendingLabel="Saving…"
          />
        </CardContent>
      </Card>
    </div>
  );
}
