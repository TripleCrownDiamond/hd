"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { media } from "@/lib/media";
import { useShortlists } from "@/lib/shortlists/shortlist-store";
import { WishlistLoading } from "@/components/ui/loading-states";

function euro(cents?: number) {
  return cents != null && cents > 0
    ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100)
    : "Auf Anfrage";
}

export function WishlistPanel() {
  const { wishlist, remove, hydrated } = useShortlists();

  // Render nothing until localStorage is read, so the empty state never flashes
  // in front of a visitor who does have saved products.
  if (!hydrated) return <WishlistLoading />;

  if (wishlist.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-elevated mb-5 flex size-16 items-center justify-center rounded-full">
            <Heart className="text-muted size-7" aria-hidden="true" />
          </div>
          <h2 className="font-display text-text text-xl font-semibold">Noch keine Merkliste</h2>
          <p className="text-muted mt-2 max-w-md text-sm">
            Klicken Sie auf einer Produktkarte auf das Herz, um es hier zu sammeln. Die Auswahl
            wird in diesem Browser gespeichert.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/brennholz">
                <Search className="size-4" />
                Brennholz entdecken
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/kaminoefen">Kaminöfen entdecken</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {wishlist.map((item) => (
        <li key={item.slug} className="min-w-0">
          <Card className="relative flex h-full min-w-0 flex-col overflow-hidden p-0">
            <Link
              href={item.href}
              className="bg-surface relative flex aspect-square items-center justify-center overflow-hidden"
            >
              {item.image && (
                <Image
                  src={media(item.image, { width: 480, height: 480, crop: "fill" })}
                  alt={item.name}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              )}
            </Link>
            <button
              type="button"
              onClick={() => remove("wishlist", item.slug)}
              className="bg-surface/90 hover:bg-surface focus-visible:outline-accent absolute top-3 right-3 flex size-9 items-center justify-center rounded-full shadow-sm transition-colors focus-visible:outline-3 focus-visible:outline-offset-2"
              aria-label={`Von Merkliste entfernen: ${item.name}`}
            >
              <X className="text-muted size-4" />
            </button>
            <div className="flex min-w-0 flex-1 flex-col p-5">
              {item.brand && (
                <p className="text-muted text-xs font-semibold tracking-wider uppercase">
                  {item.brand}
                </p>
              )}
              <Link href={item.href}>
                <h3 className="font-display text-text hover:text-accent mt-1 break-words text-base leading-tight font-semibold">
                  {item.name}
                </h3>
              </Link>
              <p className="text-text mt-auto pt-4 font-mono text-lg font-semibold tabular-nums">
                {euro(item.priceCents)}
              </p>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
