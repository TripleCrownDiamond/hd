import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="bg-elevated/40" aria-busy="true" aria-live="polite">
      <span className="sr-only" role="status">
        Seite wird geladen…
      </span>
      <div className="container-catalog py-8 md:py-12">
        <Skeleton className="mb-6 h-4 w-48" />
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
          <Skeleton className="hidden h-80 lg:block" />
          <div className="min-w-0">
            <Skeleton className="mb-6 h-40" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="border-border bg-surface min-w-0 overflow-hidden rounded-xl border"
                  aria-hidden="true"
                >
                  <Skeleton className="aspect-square rounded-none" />
                  <div className="space-y-3 p-5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
