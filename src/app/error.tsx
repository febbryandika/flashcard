"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12">
        <h2 className="font-medium">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">
          An unexpected error occurred. You can try again.
        </p>
        <Button className="mt-2" onClick={reset}>
          Try again
        </Button>
        <Link
          href="/decks"
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          Back to decks
        </Link>
      </div>
    </div>
  );
}
