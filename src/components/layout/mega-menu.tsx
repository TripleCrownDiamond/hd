"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { media } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { MegaMenuSection } from "@/lib/products/navigation";

function formatEuro(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
}

/** Links that are pages in their own right, not catalogue facets. */
const STATIC_LINKS = [{ label: "Liefergebiet", href: "/liefergebiet" }] as const;

export function MegaMenu({ sections }: { sections: MegaMenuSection[] }) {
  return (
    <NavigationMenu className="hidden flex-none justify-start xl:flex">
      <NavigationMenuList>
        {sections.map((section) => (
          <NavigationMenuItem key={section.label}>
            <NavigationMenuTrigger>{section.label}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <div className="grid gap-6 sm:grid-cols-2">
                  {section.columns.map((column) => (
                    <div key={column.title}>
                      <p className="text-muted text-xs font-semibold tracking-wider uppercase">
                        {column.title}
                      </p>
                      <ul className="mt-3 space-y-0.5">
                        {column.links.map((link) => (
                          <li key={link.href}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={link.href}
                                className="hover:bg-elevated focus-visible:outline-accent flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:outline-3 focus-visible:outline-offset-2"
                              >
                                <span className="text-text truncate">{link.label}</span>
                                <span className="text-muted shrink-0 font-mono text-xs tabular-nums">
                                  {link.count}
                                </span>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <div className="sm:col-span-2">
                    <NavigationMenuLink asChild>
                      <Link
                        href={section.href}
                        className="text-accent hover:text-text focus-visible:outline-accent inline-flex items-center gap-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-2"
                      >
                        Alle {section.count} {section.label} ansehen
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </div>

                {section.teasers.length > 0 && (
                  <div>
                    <p className="text-muted text-xs font-semibold tracking-wider uppercase">
                      Aus dem Sortiment
                    </p>
                    <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                      {section.teasers.map((teaser) => (
                        <li key={teaser.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={teaser.href}
                              className="group border-border hover:border-accent focus-visible:outline-accent block overflow-hidden rounded-lg border transition-colors focus-visible:outline-3 focus-visible:outline-offset-2"
                            >
                              <div className="bg-elevated relative aspect-square">
                                {teaser.image && (
                                  <Image
                                    src={media(teaser.image, { width: 320, height: 320, crop: "fill" })}
                                    alt=""
                                    fill
                                    sizes="200px"
                                    className="duration-base ease-spring object-cover transition-transform group-hover:scale-[1.04]"
                                  />
                                )}
                              </div>
                              <div className="p-2.5">
                                {teaser.brand && (
                                  <p className="text-muted truncate text-[0.65rem] font-semibold tracking-wider uppercase">
                                    {teaser.brand}
                                  </p>
                                )}
                                <p className="text-text mt-0.5 line-clamp-2 text-xs leading-snug font-medium">
                                  {teaser.name}
                                </p>
                                <p className="text-text mt-1 font-mono text-xs tabular-nums">
                                  {teaser.priceCents != null && teaser.priceCents > 0
                                    ? formatEuro(teaser.priceCents)
                                    : "Auf Anfrage"}
                                </p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}

        {STATIC_LINKS.map((link) => (
          <NavigationMenuItem key={link.href}>
            <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle)}>
              <Link href={link.href}>{link.label}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
