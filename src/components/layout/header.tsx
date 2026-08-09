"use client";

import { useState } from "react";
import Link from "next/link";
import { GitCompareArrows, Heart, Menu, Search, User, X } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartButton } from "@/components/layout/cart-button";
import { Logo } from "@/components/layout/logo";
import { MegaMenu } from "@/components/layout/mega-menu";
import { ShortlistButtons } from "@/components/layout/shortlist-buttons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import type { MegaMenuSection } from "@/lib/products/navigation";

/** Editorial pages, listed alongside the catalogue-driven sections. */
const staticNav = [{ label: "Liefergebiet", href: "/liefergebiet" }] as const;

export function Header({ sections }: { sections: MegaMenuSection[] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    // `relative` anchors the full-width mega-menu panel to the header.
    <header className="sticky top-0 z-sticky relative border-b border-border bg-surface">
      <div className="border-b border-border bg-brand/5 py-1.5 text-center text-xs text-muted">
        <p className="container-site">Kostenlose Lieferung ab 999 € in ausgewählten Regionen</p>
      </div>

      {/*
        Below xl the row is three tracks: two icons left, two right, and the
        wordmark centred between them. `flex-1` on both icon groups is what
        centres it — with one icon on the left and three on the right the logo
        sat visibly off-axis. From xl the groups collapse to their content and
        the mega menu takes the middle instead.
      */}
      <div className="container-site flex h-16 items-center gap-2 md:h-18">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <div className="flex flex-1 items-center gap-1 xl:flex-none">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-md text-muted hover:bg-elevated hover:text-text xl:hidden focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Menü öffnen"
            >
              <Menu className="size-5" />
            </button>
            <SearchToggle
              open={searchOpen}
              onToggle={() => setSearchOpen((v) => !v)}
              className="xl:hidden"
            />
          </div>
          <SheetContent side="left" className="flex w-full max-w-xs flex-col gap-0 p-0">
            <SheetHeader className="border-b border-border p-6">
              <SheetTitle asChild>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label={`${BRAND_NAME} Startseite`}
                >
                  <Logo className="h-6 w-auto" title={null} />
                </Link>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto p-3" aria-label="Mobile Navigation">
              <ul className="space-y-0.5">
                {/* Same catalogue data as the desktop mega menu, stacked. */}
                {sections.map((section) => (
                  <li key={section.label}>
                    <SheetClose asChild>
                      <Link
                        href={section.href}
                        className="hover:bg-elevated flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-semibold"
                      >
                        <span className="text-text">{section.label}</span>
                        <span className="text-muted font-mono text-xs tabular-nums">
                          {section.count}
                        </span>
                      </Link>
                    </SheetClose>
                    {section.columns.map((column) => (
                      <ul key={column.title} className="mt-1 mb-2 space-y-0.5 pl-3">
                        <li className="text-muted px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                          {column.title}
                        </li>
                        {column.links.map((link) => (
                          <li key={link.href}>
                            <SheetClose asChild>
                              <Link
                                href={link.href}
                                className="text-muted hover:bg-elevated hover:text-text flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors"
                              >
                                <span className="truncate">{link.label}</span>
                                <span className="shrink-0 font-mono text-xs tabular-nums">
                                  {link.count}
                                </span>
                              </Link>
                            </SheetClose>
                          </li>
                        ))}
                      </ul>
                    ))}
                  </li>
                ))}
                {staticNav.map((item) => (
                  <li key={item.href}>
                    <SheetClose asChild>
                      <Link
                        href={item.href}
                        className="text-muted hover:bg-elevated hover:text-text block rounded-md px-3 py-2 text-sm transition-colors"
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  </li>
                ))}
              </ul>
              <div className="mt-6 space-y-0.5 border-t border-border pt-3">
                <SheetClose asChild>
                  <Link
                    href="/konto/anmelden"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-elevated hover:text-text"
                  >
                    <User className="size-4" />
                    Mein Konto
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/konto/favoriten"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-elevated hover:text-text"
                  >
                    <Heart className="size-4" />
                    Merkliste
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/kaminoefen/vergleich"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-elevated hover:text-text"
                  >
                    <GitCompareArrows className="size-4" />
                    Vergleich
                  </Link>
                </SheetClose>
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        <Link
          href="/"
          className="flex shrink-0 items-center focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 focus-visible:rounded"
          aria-label={`${BRAND_NAME} Startseite`}
        >
          {/* 7:1 aspect ratio: every pixel of height costs seven of width. */}
          <Logo className="h-4 w-auto sm:h-5 md:h-8" title={null} />
        </Link>

        <MegaMenu sections={sections} />

        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2 xl:flex-none">
          <SearchToggle
            open={searchOpen}
            onToggle={() => setSearchOpen((v) => !v)}
            className="hidden xl:flex"
          />
          <Link
            href="/konto/anmelden"
            className="hidden size-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-text focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 sm:flex"
            aria-label="Mein Konto"
          >
            <User className="size-5" />
          </Link>
          <ShortlistButtons />
          <CartButton />
        </div>
      </div>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </header>
  );
}

/**
 * Rendered twice — once in the mobile icon group, once on the desktop right —
 * with the other hidden. `display: none` keeps the hidden one out of the
 * accessibility tree, so a screen reader still finds exactly one search button.
 */
function SearchToggle({
  open,
  onToggle,
  className,
}: {
  open: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "size-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-text focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 flex",
        className,
      )}
      onClick={onToggle}
      aria-label="Suche"
      aria-expanded={open}
    >
      {open ? <X className="size-5" /> : <Search className="size-5" />}
    </button>
  );
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="border-t border-border bg-surface">
      <div className="container-site py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onClose();
          }}
          className="flex gap-2"
          role="search"
        >
          <Input
            type="search"
            placeholder="Produkte, Kategorien, Ratgeber…"
            aria-label="Suche"
            autoFocus
          />
          <Button type="submit">Suchen</Button>
        </form>
      </div>
    </div>
  );
}
