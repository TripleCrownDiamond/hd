"use client";

import Link from "next/link";
import { GitCompareArrows, Heart } from "lucide-react";
import { useShortlists } from "@/lib/shortlists/shortlist-store";

function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      className="bg-accent text-surface absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full font-mono text-[0.6rem] font-semibold tabular-nums"
      aria-hidden="true"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

/**
 * Header entries for the two shortlists. Counts render only after hydration so
 * the server-rendered markup and the first client paint agree.
 */
export function ShortlistButtons() {
  const { wishlist, compare, hydrated } = useShortlists();
  const wishCount = hydrated ? wishlist.length : 0;
  const compareCount = hydrated ? compare.length : 0;

  return (
    <>
      <Link
        href="/kaminoefen/vergleich"
        className="text-muted hover:bg-elevated hover:text-text focus-visible:outline-accent relative hidden size-10 items-center justify-center rounded-md transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 sm:flex"
        aria-label={
          compareCount > 0 ? `Vergleich, ${compareCount} Modelle` : "Vergleich"
        }
      >
        <GitCompareArrows className="size-5" />
        <Badge count={compareCount} />
      </Link>
      <Link
        href="/konto/favoriten"
        className="text-muted hover:bg-elevated hover:text-text focus-visible:outline-accent relative hidden size-10 items-center justify-center rounded-md transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 sm:flex"
        aria-label={
          wishCount > 0 ? `Merkliste, ${wishCount} Produkte` : "Merkliste"
        }
      >
        <Heart className="size-5" />
        <Badge count={wishCount} />
      </Link>
    </>
  );
}
