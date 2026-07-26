import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { StudySession } from "@/components/study-session";
import { getDueStudyCards, getUserDeck } from "@/server/db/queries";
import { requireUser } from "@/server/lib/require-user";

export default async function DeckStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const deck = await getUserDeck(id, user.id);

  if (!deck) notFound();

  const cards = await getDueStudyCards(user.id, deck.id);

  if (cards.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12">
          <h1 className="font-medium">Nothing due in this deck</h1>
          <p className="text-muted-foreground text-sm">
            You&apos;re caught up. Come back when cards are scheduled.
          </p>
          <Link
            href={`/decks/${deck.id}`}
            className={buttonVariants({ className: "mt-2" })}
          >
            Back to deck
          </Link>
        </div>
      </div>
    );
  }

  return (
    <StudySession
      cards={cards}
      title={deck.name}
      backHref={`/decks/${deck.id}`}
      backLabel="← Back to deck"
    />
  );
}
