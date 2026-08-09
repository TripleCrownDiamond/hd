"use client";

import Link from "next/link";
import { Flame, Heart, GitCompareArrows } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn, formatPrice } from "@/lib/utils";
import type { StoveCatalogProduct } from "@/lib/products/catalog";

export function StoveProductCard({
  product,
  className,
}: {
  product: StoveCatalogProduct;
  className?: string;
}) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <Card
      className={cn(
        "group min-w-0 flex flex-col overflow-hidden p-0 transition-all duration-base ease-spring hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
      itemScope
      itemType="https://schema.org/Product"
    >
      <Link
        href={`/kaminofen/${product.slug}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-brand via-brand/90 to-brand/70"
        aria-hidden="true"
        tabIndex={-1}
      >
        <Flame className="size-16 text-accent/80" strokeWidth={1.5} />
        <button
          type="button"
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-surface focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
          onClick={(e) => {
            e.preventDefault();
            setIsFavorite((v) => !v);
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
        <Badge variant="brand" className="absolute left-3 top-3 border border-white/20">
          {product.energyClass}
        </Badge>
      </Link>

      <CardContent className="flex min-w-0 flex-1 flex-col p-5 pt-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {product.brand}
          </p>
          <Link href={`/kaminofen/${product.slug}`}>
            <h3 className="mt-1 break-words font-display text-base font-semibold leading-tight text-text transition-colors group-hover:text-accent">
              {product.name.replace(`${product.brand} `, "")}
            </h3>
          </Link>
        </div>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
          <dt className="text-muted">Leistung</dt>
          <dd className="text-right font-mono font-medium tabular-nums text-text">
            {product.powerKw} kW
          </dd>
          <dt className="text-muted">Wirkungsgrad</dt>
          <dd className="text-right font-mono font-medium tabular-nums text-text">
            {product.efficiency} %
          </dd>
          <dt className="text-muted">Brennstoff</dt>
          <dd className="min-w-0 break-words text-right font-medium text-text">{product.fuel}</dd>
          <dt className="text-muted">Rohr Ø</dt>
          <dd className="text-right font-mono font-medium tabular-nums text-text">
            {product.flueDiameter} mm
          </dd>
        </dl>

        <Separator className="my-4" />

        <div className="mt-auto">
          <p className="font-mono text-2xl font-semibold tabular-nums text-text">
            {formatPrice(product.priceCents)}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            inkl. MwSt., zzgl. Versand · {product.deliveryTime}
          </p>
          <div className="mt-4 flex min-w-0 gap-2">
            <Button asChild size="sm" className="min-w-0 flex-1">
              <Link href={`/kaminofen/${product.slug}`}>Details ansehen</Link>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              aria-label={`Zum Vergleich: ${product.name}`}
            >
              <GitCompareArrows className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
