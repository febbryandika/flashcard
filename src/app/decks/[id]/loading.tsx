import { Skeleton } from "@/components/ui/skeleton";

export default function DeckDetailLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-16" />
      </div>

      <div className="flex flex-col gap-4 rounded-xl p-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-xl p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
