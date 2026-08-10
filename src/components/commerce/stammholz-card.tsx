"use client";

import { useState } from "react";
import Image from "next/image";
import { Truck, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StammholzProduct, StammholzVariant } from "@/lib/fixtures";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function StammholzCard({ product }: { product: StammholzProduct }) {
  const defaultVariant =
    product.variants.find((v) => v.rm === 50) ?? product.variants[0]!;
  const [selected, setSelected] = useState<StammholzVariant>(defaultVariant);

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      {/* Image */}
      <div className="bg-elevated relative aspect-[4/3] overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 hover:scale-105"
          unoptimized
        />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {product.badges.slice(0, 2).map((b) => (
            <Badge
              key={b.label}
              variant={b.variant as "success" | "info" | "warning" | "accent" | "brand" | "default"}
              className="text-[10px]"
            >
              {b.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Holzart + Name */}
        <div>
          <p className="text-muted text-xs font-medium uppercase tracking-wide">
            {product.woodType}
          </p>
          <h3 className="text-text mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">
            {product.name.replace(/\s*–\s*PEFC$/, "")}
          </h3>
        </div>

        {/* Mengenauswahl */}
        <div>
          <p className="text-muted mb-1.5 text-xs font-medium">Menge wählen</p>
          <div className="grid grid-cols-2 gap-1.5">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelected(v)}
                disabled={!v.available}
                aria-pressed={selected.id === v.id}
                className={[
                  "flex flex-col rounded-md border px-2 py-1.5 text-left text-xs transition-all",
                  selected.id === v.id
                    ? "border-brand bg-brand/5 text-brand font-semibold"
                    : "border-border text-muted hover:border-brand/50 hover:text-text",
                  !v.available && "cursor-not-allowed opacity-40",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="font-semibold">{v.label}</span>
                <span className="text-[10px] opacity-70">{v.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preis */}
        <div className="mt-auto border-t border-border pt-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-text text-lg font-bold">
                {formatPrice(selected.priceCents)}
              </p>
              <p className="text-muted text-[10px]">
                {selected.rm} Rm ·{" "}
                {formatPrice(product.pricePerRmCents)}/Rm · inkl. MwSt.
              </p>
            </div>
            <Button size="sm" className="shrink-0 gap-1.5">
              <Truck className="size-3.5" />
              Anfragen
            </Button>
          </div>
        </div>

        {/* PEFC hint */}
        <p className="text-muted flex items-center gap-1 text-[10px]">
          <CheckCircle2 className="size-3 shrink-0 text-green-600" />
          PEFC-zertifiziert · ab Forststraße
        </p>
      </div>
    </Card>
  );
}
