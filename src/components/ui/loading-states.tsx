import { Skeleton } from "@/components/ui/skeleton";

function LoadingStatus({ label }: { label: string }) {
  return (
    <span className="sr-only" role="status">
      {label}
    </span>
  );
}

export function ProductPageLoading() {
  return (
    <div className="bg-elevated/40" aria-busy="true">
      <LoadingStatus label="Produkt wird geladen…" />
      <div className="container-catalog py-8 md:py-12">
        <Skeleton className="mb-6 h-4 w-48" aria-hidden="true" />
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <Skeleton className="aspect-square w-full rounded-xl" aria-hidden="true" />
          <div className="space-y-5" aria-hidden="true">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-9 w-40" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="space-y-3 pt-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-6 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WishlistLoading() {
  return (
    <div aria-busy="true">
      <LoadingStatus label="Merkliste wird geladen…" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="border-border bg-surface min-w-0 overflow-hidden rounded-xl border"
          >
            <Skeleton className="aspect-square rounded-none" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComparisonLoading() {
  return (
    <div className="bg-elevated/40" aria-busy="true">
      <LoadingStatus label="Vergleich wird geladen…" />
      <div className="container-catalog py-8 md:py-12">
        <Skeleton className="mb-6 h-4 w-48" aria-hidden="true" />
        <div
          className="border-border bg-surface mb-6 rounded-xl border p-6"
          aria-hidden="true"
        >
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="mt-3 h-4 w-[32rem] max-w-full" />
        </div>
        <div className="border-border bg-surface overflow-hidden rounded-xl border" aria-hidden="true">
          <Skeleton className="h-40 w-full rounded-none" />
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="border-border grid grid-cols-3 gap-4 border-t p-4">
              <Skeleton className="h-5" />
              <Skeleton className="h-5" />
              <Skeleton className="h-5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CartPageLoading() {
  return (
    <div aria-busy="true">
      <LoadingStatus label="Warenkorb wird geladen…" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" aria-hidden="true">
        <div className="space-y-4">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="border-border bg-surface rounded-xl border p-5">
              <Skeleton className="h-6 w-3/5" />
              <Skeleton className="mt-4 h-12 w-full" />
            </div>
          ))}
        </div>
        <div className="border-border bg-surface h-64 rounded-xl border p-6">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-5 h-5 w-full" />
          <Skeleton className="mt-3 h-5 w-full" />
          <Skeleton className="mt-6 h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
