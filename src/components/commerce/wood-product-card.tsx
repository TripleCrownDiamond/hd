"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, TreeDeciduous, Ruler, Droplets, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn, formatPrice, formatBasePrice } from "@/lib/utils";
import { media } from "@/lib/media";
import type { WoodCatalogProduct } from "@/lib/products/catalog";
import { useShortlists } from "@/lib/shortlists/shortlist-store";

export function WoodProductCard({
  product,
  className,
  priority = false,
}: {
  product: WoodCatalogProduct;
  className?: string;
  priority?: boolean;
}) {
  const { has, toggle, hydrated } = useShortlists();
  const isFavorite = hydrated && has("wishlist", product.slug);
  const hero = product.image
    ? media(product.image, { width: 600, height: 600, crop: "fill" })
    : null;
  const href = `/produkt/${product.slug}`;
  const hasPublicPrice = product.priceCents > 0;
  // Rows the source left blank are omitted rather than printed as
  // "Nicht angegeben" — an empty column reads as a broken listing.
  const declared = [
    { label: "Holzart", value: product.woodType, Icon: TreeDeciduous },
    { label: "Länge", value: product.length, Icon: Ruler },
    { label: "Restfeuchte", value: product.moisture, Icon: Droplets },
    { label: "Menge", value: product.unit, Icon: Package },
  ].filter((row) => row.value && row.value !== "Nicht angegeben");

  return (
    <Card
      className={cn(
        "group ease-spring duration-base relative min-w-0 flex flex-col overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
      itemScope
      itemType="https://schema.org/Product"
    >
      <Link
        href={href}
        className="bg-surface relative flex aspect-square items-center justify-center overflow-hidden"
        tabIndex={-1}
        aria-hidden="true"
      >
        {hero ? (
          <Image
            src={hero}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="ease-spring duration-emphasis object-cover transition-transform group-hover:scale-[1.03]"
          />
        ) : (
          <TreeDeciduous className="text-brand/20 size-20" strokeWidth={1} aria-hidden="true" />
        )}

        <Badge
          variant="brand"
          className="absolute top-3 left-3 border border-white/20 shadow-sm"
        >
          Lieferantendaten
        </Badge>

        <button
          type="button"
          className="bg-surface/90 hover:bg-surface focus-visible:outline-accent absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-colors focus-visible:outline-3 focus-visible:outline-offset-2"
          onClick={(e) => {
            e.preventDefault();
            toggle("wishlist", {
              slug: product.slug,
              name: product.name,
              brand: product.brand,
              image: product.image,
              priceCents: product.priceCents,
              href,
              kind: product.type,
            });
          }}
          aria-label={
            isFavorite
              ? `Von Merkliste entfernen: ${product.name}`
              : `Zur Merkliste hinzufügen: ${product.name}`
          }
          aria-pressed={isFavorite}
        >
          <Heart
            className={cn(
              "size-4 transition-colors",
              isFavorite ? "fill-accent text-accent" : "text-muted",
            )}
          />
        </button>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div className="min-w-0">
          {product.brand && (
            <p className="text-muted text-xs font-semibold tracking-wider uppercase">
              {product.brand}
            </p>
          )}
          <Link href={href} className="min-w-0">
            <h3 className="font-display text-text group-hover:text-accent mt-1 break-words text-base leading-tight font-semibold transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {declared.length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
            {declared.map(({ label, value, Icon }) => (
              <div key={label} className="contents">
                <dt className="text-muted flex items-center gap-1.5">
                  <Icon className="size-3.5" aria-hidden="true" />
                  {label}
                </dt>
                <dd className="text-text font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <Separator />

        <div className="mt-auto">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span
              className="text-text font-mono text-2xl font-semibold tracking-tight tabular-nums"
              itemProp="price"
            >
              {hasPublicPrice ? formatPrice(product.priceCents) : "Auf Anfrage"}
            </span>
            {hasPublicPrice && product.basePriceCents && (
              <span className="text-muted min-w-0 break-words font-mono text-xs tabular-nums">
                {formatBasePrice(product.basePriceCents, product.basePriceUnit ?? "")}
              </span>
            )}
          </div>
          <p className="text-muted mt-0.5 text-xs">
            {hasPublicPrice
              ? "inkl. MwSt. · Lieferantenpreis, Versand noch nicht kalkuliert"
              : "Preis wird nach Prüfung veröffentlicht"}
          </p>

          {/* No cart action: these records are still in catalogue review. */}
          <Button asChild size="sm" className="mt-3 w-full">
            <Link href={href}>Details ansehen</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
