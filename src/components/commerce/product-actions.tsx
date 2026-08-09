"use client";

import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart, type CartItem } from "@/lib/cart/cart-store";
import { useShortlists, type ShortlistEntry } from "@/lib/shortlists/shortlist-store";

interface ProductActionsProps {
  product: {
    id: string;
    slug: string;
    name: string;
    brand?: string;
    image?: string;
    type: "wood" | "kindling" | "briquette" | "pellet" | "accessory";
    priceCents: number;
    basePriceCents?: number;
    basePriceUnit?: string;
    reviewStatus: string;
  };
}

export function ProductActions({ product }: ProductActionsProps) {
  const { add } = useCart();
  const { has, toggle, hydrated } = useShortlists();
  const href = `/produkt/${product.slug}`;
  const canAddToCart = product.reviewStatus === "approved" && product.priceCents > 0;
  const isFavorite = hydrated && has("wishlist", product.slug);

  const shortlistEntry: ShortlistEntry = {
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    image: product.image,
    priceCents: product.priceCents > 0 ? product.priceCents : undefined,
    href,
    kind: product.type,
  };

  const cartItem: CartItem = {
    id: product.id,
    slug: product.slug,
    href,
    name: product.name,
    quantity: 1,
    priceCents: product.priceCents,
    basePriceCents: product.basePriceCents,
    basePriceUnit: product.basePriceUnit,
    image: product.image,
    imageKind: product.type === "kindling" ? "wood" : product.type,
  };

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          size="lg"
          className="min-w-0 flex-1"
          disabled={!canAddToCart}
          onClick={() => add(cartItem)}
        >
          <ShoppingCart className="size-4" />
          In den Warenkorb
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => toggle("wishlist", shortlistEntry)}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? `Von Merkliste entfernen: ${product.name}`
              : `Zur Merkliste hinzufügen: ${product.name}`
          }
        >
          <Heart className={cn("size-4", isFavorite && "fill-accent text-accent")} />
          {isFavorite ? "Gemerkt" : "Merken"}
        </Button>
      </div>
      {!canAddToCart ? (
        <p className="text-muted text-xs" role="note">
          Der Warenkorb wird nach Preis- und Katalogfreigabe aktiviert.
        </p>
      ) : null}
    </div>
  );
}
