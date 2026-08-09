"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart/cart-store";

export function CartButton() {
  const { count, toggle } = useCart();

  return (
    <button
      type="button"
      onClick={toggle}
      className="relative flex size-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-text focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
      aria-label={`Warenkorb${count > 0 ? `, ${count} Artikel` : ""}`}
    >
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold tabular-nums text-white"
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
