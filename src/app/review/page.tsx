"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StudySession } from "@/components/study-session";
import { HttpError, fetchJson } from "@/lib/http";
import type { StudyCard } from "@/lib/study";

export default function ReviewPage() {
  const router = useRouter();
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ["due"],
    queryFn: () => fetchJson<{ cards: StudyCard[] }>("/api/review/due"),
  });

  const isUnauthorized = error instanceof HttpError && error.status === 401;

  useEffect(() => {
    if (isUnauthorized) router.push("/sign-in");
  }, [isUnauthorized, router]);

  if (isPending) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    if (isUnauthorized) return null;

    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12">
          <h1 className="font-medium">Couldn&apos;t load your review queue</h1>
          <p className="text-muted-foreground text-sm">{error.message}</p>
          <Button className="mt-2" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (data.cards.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12">
          <h1 className="font-medium">Nothing due today</h1>
          <p className="text-muted-foreground text-sm">
            You&apos;re caught up — nice work.
          </p>
          <Link href="/decks" className={buttonVariants({ className: "mt-2" })}>
            All decks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <StudySession
      cards={data.cards}
      title="Daily review"
      backHref="/decks"
      backLabel="← All decks"
    />
  );
}
