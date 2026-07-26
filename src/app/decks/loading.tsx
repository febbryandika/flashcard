import { Skeleton } from "@/components/ui/skeleton";

export default function DecksLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-4 rounded-xl p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
