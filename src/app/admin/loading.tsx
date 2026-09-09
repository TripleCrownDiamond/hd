import { Skeleton } from "@/components/ui/skeleton";

/**
 * Without this, every admin route fell back to the root `loading.tsx` — the
 * storefront catalogue skeleton, complete with a 280px filter sidebar the admin
 * does not have. This shows the shape the admin pages actually take.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-8" aria-busy="true">
      <span className="sr-only" role="status">
        Chargement…
      </span>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
