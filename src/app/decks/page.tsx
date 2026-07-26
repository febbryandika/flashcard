import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { DeleteDeckButton } from "@/components/delete-deck-button";
import { SignOutButton } from "@/components/sign-out-button";
import { getDecksWithStats } from "@/server/db/queries";
import { requireUser } from "@/server/lib/require-user";

export default async function DecksPage() {
  const user = await requireUser();
  const decks = await getDecksWithStats(user.id);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Decks</h1>
          <p className="text-muted-foreground text-sm">
            Signed in as {user.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/review"
            className={buttonVariants({ variant: "outline" })}
          >
            Review
          </Link>
          <Link href="/decks/new" className={buttonVariants()}>
            New deck
          </Link>
          <SignOutButton />
        </div>
      </header>

      {decks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12 text-center">
          <h2 className="font-medium">No decks yet</h2>
          <p className="text-muted-foreground text-sm">
            Create your first deck to start studying.
          </p>
          <Link
            href="/decks/new"
            className={buttonVariants({ className: "mt-2" })}
          >
            Create deck
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Card key={deck.id}>
              <CardHeader>
                <CardTitle>
                  <h3 className="font-heading text-base leading-snug font-medium">
                    <Link
                      href={`/decks/${deck.id}`}
                      className="hover:underline"
                    >
                      {deck.name}
                    </Link>
                  </h3>
                </CardTitle>
                {deck.description ? (
                  <CardDescription>{deck.description}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {deck.language ? (
                  <p className="text-muted-foreground text-xs">
                    {deck.language}
                  </p>
                ) : null}
                <p className="text-muted-foreground text-sm">
                  {deck.totalCards} {deck.totalCards === 1 ? "card" : "cards"} ·{" "}
                  {deck.dueToday} due today
                </p>
              </CardContent>
              <CardFooter className="justify-between">
                <Link
                  href={`/decks/${deck.id}/edit`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Edit
                </Link>
                <DeleteDeckButton deckId={deck.id} deckName={deck.name} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
