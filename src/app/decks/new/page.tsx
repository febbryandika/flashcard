import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeckForm } from "@/components/deck-form";
import { createDeck } from "@/server/actions/decks";
import { requireUser } from "@/server/lib/require-user";

export default async function NewDeckPage() {
  await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col p-6">
      <Card>
        <CardHeader>
          <CardTitle>New deck</CardTitle>
        </CardHeader>
        <CardContent>
          <DeckForm
            action={createDeck}
            submitLabel="Create deck"
            pendingLabel="Creating…"
          />
        </CardContent>
      </Card>
    </div>
  );
}
