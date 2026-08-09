"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  TreeDeciduous,
  Flame,
  Package,
  Wrench,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart, type CartItem } from "@/lib/cart/cart-store";
import { media } from "@/lib/media";
import { formatPrice, formatBasePrice } from "@/lib/utils";

const iconByKind = {
  wood: TreeDeciduous,
  stove: Flame,
  briquette: Package,
  pellet: Package,
  accessory: Wrench,
} as const;

function CartLine({ item }: { item: CartItem }) {
  const { remove, setQuantity } = useCart();
  const Icon = iconByKind[item.imageKind];
  const lineTotal = item.priceCents * item.quantity;
  const href =
    item.href ??
    (item.imageKind === "stove" ? `/kaminofen/${item.slug}` : `/produkt/${item.slug}`);

  return (
    <li className="flex gap-4 py-4">
      <Link
        href={href}
        aria-label={item.name}
        className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-wood/15 via-elevated to-brand/10"
      >
        {item.image ? (
          <Image
            src={media(item.image, { width: 128, height: 128, crop: "fill" })}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <Icon className="size-6 text-brand/60" strokeWidth={1.5} aria-hidden="true" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={href}
              className="text-sm font-medium text-text hover:text-accent"
            >
              {item.name}
            </Link>
            {item.variant && <p className="text-xs text-muted">{item.variant}</p>}
          </div>
          <button
            type="button"
            onClick={() => remove(item.id)}
            className="rounded-md p-1 text-muted transition-colors hover:bg-elevated hover:text-danger focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
            aria-label={`Entfernen: ${item.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="inline-flex items-center rounded-md border border-border">
            <button
              type="button"
              onClick={() => setQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="flex size-8 items-center justify-center rounded-l-md text-muted transition-colors hover:bg-elevated hover:text-text disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
              aria-label={`Menge verringern: ${item.name}`}
            >
              <Minus className="size-3.5" />
            </button>
            <span
              className="flex min-w-8 items-center justify-center font-mono text-sm tabular-nums text-text"
              aria-live="polite"
            >
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(item.id, item.quantity + 1)}
              className="flex size-8 items-center justify-center rounded-r-md text-muted transition-colors hover:bg-elevated hover:text-text focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
              aria-label={`Menge erhöhen: ${item.name}`}
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-semibold tabular-nums text-text">
              {formatPrice(lineTotal)}
            </p>
            {item.basePriceCents && item.basePriceUnit && (
              <p className="font-mono text-xs text-muted tabular-nums">
                {formatBasePrice(item.basePriceCents, item.basePriceUnit)}
              </p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export function CartSheet() {
  const { items, isOpen, close, subtotalCents, count, clear } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(v) => (v ? null : close())}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-6">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-brand" aria-hidden="true" />
            Warenkorb
            <span className="ml-1 rounded-md bg-elevated px-2 py-0.5 font-mono text-xs tabular-nums text-muted">
              {count}
            </span>
          </SheetTitle>
          <SheetDescription>
            {count > 0
              ? "Menge anpassen oder entfernen — serverseitig neu berechnet beim Checkout."
              : "Ihr Warenkorb ist leer."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {count === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-elevated">
                <ShoppingBag className="size-6 text-muted" aria-hidden="true" />
              </div>
              <p className="font-display text-lg font-semibold text-text">
                Noch nichts drin.
              </p>
              <p className="mt-1 max-w-xs text-sm text-muted">
                Legen Sie Brennholz, Pellets oder einen Kaminofen hinein — Preise und Lieferung
                werden transparent kalkuliert.
              </p>
              <Button asChild className="mt-6" onClick={close}>
                <Link href="/brennholz">Brennholz entdecken</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <CartLine key={item.id} item={item} />
              ))}
            </ul>
          )}
        </div>

        {count > 0 && (
          <div className="border-t border-border bg-elevated/40 p-6">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted">
                <dt>Zwischensumme</dt>
                <dd className="font-mono tabular-nums text-text">
                  {formatPrice(subtotalCents)}
                </dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Versand</dt>
                <dd>Wird im Checkout berechnet</dd>
              </div>
              <Separator className="my-2" />
              <div className="flex items-baseline justify-between">
                <dt className="font-display text-base font-semibold text-text">Summe</dt>
                <dd className="font-mono text-xl font-semibold tabular-nums text-text">
                  {formatPrice(subtotalCents)}
                </dd>
              </div>
              <p className="text-xs text-muted">inkl. MwSt., zzgl. Versand</p>
            </dl>

            <div className="mt-5 space-y-2">
              <Button asChild fullWidth size="lg" onClick={close}>
                <Link href="/kasse">
                  Zur Kasse
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <div className="flex gap-2">
                <Button asChild variant="secondary" className="flex-1" onClick={close}>
                  <Link href="/warenkorb">Warenkorb ansehen</Link>
                </Button>
                <Button
                  variant="ghost"
                  onClick={clear}
                  aria-label="Warenkorb leeren"
                  className="text-danger hover:bg-danger/5 hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
