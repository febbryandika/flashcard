import { requireUser } from "@/server/lib/require-user";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DecksPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Decks</h1>
          <p className="text-muted-foreground text-sm">
            Signed in as {user.email}
          </p>
        </div>
        <SignOutButton />
      </header>
      <p className="text-muted-foreground text-sm">
        No decks yet — deck management arrives in Phase 3.
      </p>
    </div>
  );
}
