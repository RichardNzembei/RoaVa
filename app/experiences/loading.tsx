import { Skeleton } from "@/components/skeleton";

// Skeleton for the discovery/browse grid while data loads.
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-6">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-40 w-full rounded-card" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="aspect-[4/3] w-full rounded-card" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </main>
  );
}
