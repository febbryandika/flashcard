import { Skeleton } from "@/components/ui/skeleton";

export default function DeckStudyLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
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
