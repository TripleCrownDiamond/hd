import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Products per page. A stove card is tall; more than this and the page crawls. */
export const PAGE_SIZE = 24;

export interface PageSlice<T> {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
  from: number;
  to: number;
}

/**
 * Cut a result set down to one page.
 *
 * Listing pages render every product they are given, so a 1 300-product
 * catalogue produced 1 300 cards and a response measured in minutes.
 */
export function paginate<T>(items: T[], rawPage: string | string[] | undefined): PageSlice<T> {
  const requested = Number.parseInt(Array.isArray(rawPage) ? (rawPage[0] ?? "") : (rawPage ?? ""), 10);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), pageCount) : 1;
  const from = (page - 1) * PAGE_SIZE;
  return {
    items: items.slice(from, from + PAGE_SIZE),
    page,
    pageCount,
    total: items.length,
    from: items.length === 0 ? 0 : from + 1,
    to: Math.min(from + PAGE_SIZE, items.length),
  };
}

/** Page numbers to render: first, last, and a window around the current one. */
function pageNumbers(page: number, pageCount: number): Array<number | "gap"> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const window = new Set([1, pageCount, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => window.add(n));
  if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach((n) => window.add(n));

  const sorted = [...window].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  let previous = 0;
  for (const number of sorted) {
    if (previous && number - previous > 1) out.push("gap");
    out.push(number);
    previous = number;
  }
  return out;
}

export function Pagination({
  slice,
  basePath,
  searchParams,
}: {
  slice: PageSlice<unknown>;
  basePath: string;
  /** Current query, so filters survive a page change. */
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (slice.pageCount <= 1) return null;

  const hrefFor = (page: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams ?? {})) {
      if (key === "seite" || value == null) continue;
      query.set(key, Array.isArray(value) ? (value[0] ?? "") : value);
    }
    if (page > 1) query.set("seite", String(page));
    const suffix = query.toString();
    return suffix ? `${basePath}?${suffix}` : basePath;
  };

  const linkClass =
    "border-border hover:bg-elevated focus-visible:outline-accent flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm transition-colors focus-visible:outline-3 focus-visible:outline-offset-2";

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Seitennavigation">
      {slice.page > 1 ? (
        <Link href={hrefFor(slice.page - 1)} className={linkClass} rel="prev">
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="sr-only">Vorherige Seite</span>
        </Link>
      ) : (
        <span className={cn(linkClass, "text-muted/40 pointer-events-none")} aria-hidden="true">
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pageNumbers(slice.page, slice.pageCount).map((entry, index) =>
        entry === "gap" ? (
          <span key={`gap-${index}`} className="text-muted px-1" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={hrefFor(entry)}
            aria-current={entry === slice.page ? "page" : undefined}
            className={cn(
              linkClass,
              entry === slice.page && "bg-brand border-brand text-white hover:bg-brand",
            )}
          >
            {entry}
          </Link>
        ),
      )}

      {slice.page < slice.pageCount ? (
        <Link href={hrefFor(slice.page + 1)} className={linkClass} rel="next">
          <ChevronRight className="size-4" aria-hidden="true" />
          <span className="sr-only">Nächste Seite</span>
        </Link>
      ) : (
        <span className={cn(linkClass, "text-muted/40 pointer-events-none")} aria-hidden="true">
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
