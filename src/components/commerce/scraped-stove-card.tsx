"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, GitCompareArrows } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { media } from "@/lib/media";
import type { ScrapedProduct } from "@/lib/products/scraped";
import { useShortlists } from "@/lib/shortlists/shortlist-store";

export function ScrapedStoveCard({
  product,
  className,
  priority = false,
}: {
  product: ScrapedProduct;
  className?: string;
  priority?: boolean;
}) {
  const { has, toggle, hydrated, compareIsFull } = useShortlists();
  const isFavorite = hydrated && has("wishlist", product.slug);
  const inCompare = hydrated && has("compare", product.slug);
  const power =
    product.technical.power_kw_min && product.technical.power_kw_max
      ? `${product.technical.power_kw_min}–${product.technical.power_kw_max} kW`
      : product.technical.power_kw_nominal
        ? `${product.technical.power_kw_nominal} kW`
        : "—";
  const cldHero =
    product.media_cloudinary?.variants[0]?.main ?? product.media_cloudinary?.hero ?? null;
  const hero = cldHero
    ? media(cldHero, { width: 600, height: 600, crop: "fill" })
    : (product.variants[0]?.main_image_url_source ??
      product.media.hero_image_url_source ??
      product.media.gallery_url_sources[0]);
  const useCloudinary = Boolean(cldHero);
  const displayName = product.model;
  const isPendingReview = product.review_status !== "approved";
  const entry = {
    slug: product.slug,
    name: displayName,
    brand: product.brand,
    image: cldHero ?? undefined,
    priceCents: product.pricing.price_cents_public ?? undefined,
    href: `/kaminofen/${product.slug}`,
    kind: "stove" as const,
    comparison: {
      powerKwNominal: product.technical.power_kw_nominal,
      powerKwMin: product.technical.power_kw_min,
      powerKwMax: product.technical.power_kw_max,
      efficiencyPct: product.technical.efficiency_pct,
      energyClass: product.technical.energy_class,
      fuel: product.technical.fuel,
      heightMm: product.technical.dimensions_mm.height,
      widthMm: product.technical.dimensions_mm.width,
      depthMm: product.technical.dimensions_mm.depth,
      weightKg: product.technical.weight_kg,
      flueDiameterMm: product.technical.flue_diameter_mm,
    },
  };
  const hasPublicPrice =
    !product.pricing.quote_mode && product.pricing.price_cents_public != null;

  return (
    <Card
      className={cn(
        "group duration-base ease-spring min-w-0 flex flex-col overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <Link
        href={`/kaminofen/${product.slug}`}
        className="bg-surface relative flex aspect-square items-center justify-center overflow-hidden"
        tabIndex={-1}
        aria-hidden="true"
      >
        {hero && (
          <Image
            src={hero}
            alt={displayName}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="duration-emphasis ease-spring object-cover transition-transform group-hover:scale-[1.03]"
            unoptimized={!useCloudinary}
          />
        )}
        <button
          type="button"
          className="bg-surface/90 hover:bg-surface focus-visible:outline-accent absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-colors focus-visible:outline-3 focus-visible:outline-offset-2"
          onClick={(e) => {
            e.preventDefault();
            toggle("wishlist", entry);
          }}
          aria-label={
            isFavorite
              ? `Von Merkliste entfernen: ${displayName}`
              : `Zur Merkliste hinzufügen: ${displayName}`
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

        {product.technical.energy_class && !isPendingReview ? (
          <Badge
            variant="brand"
            className="absolute bottom-3 left-3 border border-white/20"
          >
            {product.technical.energy_class}
          </Badge>
        ) : null}
      </Link>

      <CardContent className="flex min-w-0 flex-1 flex-col p-5 pt-5">
        <div className="min-w-0">
          <p className="text-muted text-xs font-semibold tracking-wider uppercase">
            {product.brand}
          </p>
          <Link href={`/kaminofen/${product.slug}`}>
            <h3 className="font-display text-text group-hover:text-accent mt-1 break-words text-base leading-tight font-semibold transition-colors">
              {displayName}
            </h3>
          </Link>
        </div>

        {/* The four facts manufacturers publish most consistently. Fuel and
            colour counts were empty for the large majority of the catalogue. */}
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
          <dt className="text-muted">Leistung</dt>
          <dd className="text-text text-right font-mono font-medium tabular-nums">
            {power}
          </dd>
          <dt className="text-muted">Höhe</dt>
          <dd className="text-text text-right font-mono font-medium tabular-nums">
            {product.technical.dimensions_mm.height
              ? `${product.technical.dimensions_mm.height} mm`
              : "—"}
          </dd>
          <dt className="text-muted">Wirkungsgrad</dt>
          <dd className="text-text text-right font-mono font-medium tabular-nums">
            {product.technical.efficiency_pct != null
              ? `${product.technical.efficiency_pct} %`
              : "—"}
          </dd>
          <dt className="text-muted">Gewicht</dt>
          <dd className="text-text text-right font-mono font-medium tabular-nums">
            {product.technical.weight_kg != null ? `${product.technical.weight_kg} kg` : "—"}
          </dd>
        </dl>

        <Separator className="my-4" />

        <div className="mt-auto">
          <p className="text-text font-mono text-base font-semibold tabular-nums">
            {hasPublicPrice
              ? `ab ${formatEuro(product.pricing.price_cents_public!)}`
              : "Auf Anfrage"}
          </p>
          <p className="text-muted mt-0.5 text-xs">
            {hasPublicPrice
              ? "inkl. MwSt., zzgl. Versand"
              : "Persönliches Angebot für Produkt und Montage"}
          </p>
          <div className="mt-4 flex min-w-0 gap-2">
            <Button asChild size="sm" className="min-w-0 flex-1">
              <Link href={`/kaminofen/${product.slug}`}>Details ansehen</Link>
            </Button>
            <Button
              size="sm"
              variant={inCompare ? "primary" : "secondary"}
              // Only block adding when the comparison is full; removing stays possible.
              disabled={!inCompare && compareIsFull}
              onClick={() => toggle("compare", entry)}
              aria-pressed={inCompare}
              aria-label={
                inCompare
                  ? `Aus dem Vergleich entfernen: ${displayName}`
                  : `Zum Vergleich hinzufügen: ${displayName}`
              }
            >
              <GitCompareArrows className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatEuro(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
