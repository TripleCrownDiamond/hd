"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { isActivePath } from "@/components/layout/nav-link";
import { cn } from "@/lib/utils";
import { media } from "@/lib/media";
import type { MegaMenuSection } from "@/lib/products/navigation";

/** Links that are pages in their own right, not catalogue facets. */
const STATIC_LINKS = [{ label: "Liefergebiet", href: "/liefergebiet" }] as const;

/**
 * Marks the section you are browsing. Everything here is `text-muted` by
 * default, so without this the header gives no clue which of five destinations
 * you are currently on.
 */
const ACTIVE_TRIGGER = "text-text font-semibold";

export function MegaMenu({ sections }: { sections: MegaMenuSection[] }) {
  const pathname = usePathname() ?? "";
  return (
    <NavigationMenu className="hidden xl:flex xl:flex-1 xl:justify-center">
      <NavigationMenuList>
        {sections.map((section) => (
          <NavigationMenuItem key={section.label}>
            {section.columns.length > 0 ? (
              <>
                <NavigationMenuTrigger
                  className={cn(isActivePath(pathname, section.href) && ACTIVE_TRIGGER)}
                >
                  {section.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="flex gap-8 p-6">
                    <div className="flex gap-6">
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
                    </div>
                    {section.teasers.length > 0 && (
                      <div className="border-border ml-4 flex shrink-0 flex-col gap-3 border-l pl-4">
                        {section.teasers.map((teaser) => (
                          <Link
                            key={teaser.href}
                            href={teaser.href}
                            className="group flex items-center gap-3 rounded-md transition-colors hover:bg-elevated"
                          >
                            {teaser.image && (
                              <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                                <Image
                                  src={media(teaser.image, { width: 128, height: 128, crop: "fit" })}
                                  alt={teaser.name}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            )}
                            <div className="min-w-0">
                              {teaser.brand && (
                                <p className="text-muted text-[10px] font-semibold uppercase tracking-wider">
                                  {teaser.brand}
                                </p>
                              )}
                              <p className="text-text truncate text-sm font-medium">
                                {teaser.name}
                              </p>
                              {teaser.priceCents != null && (
                                <p className="text-accent font-mono text-xs tabular-nums">
                                  {(teaser.priceCents / 100).toFixed(2)} €
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </NavigationMenuContent>
              </>
            ) : (
              <NavigationMenuLink
                asChild
                className={cn(
                  navigationMenuTriggerStyle,
                  isActivePath(pathname, section.href) && ACTIVE_TRIGGER,
                )}
              >
                <Link
                  href={section.href}
                  aria-current={isActivePath(pathname, section.href) ? "page" : undefined}
                >
                  {section.label}
                </Link>
              </NavigationMenuLink>
            )}
          </NavigationMenuItem>
        ))}

        {STATIC_LINKS.map((link) => (
          <NavigationMenuItem key={link.href}>
            <NavigationMenuLink
              asChild
              className={cn(
                navigationMenuTriggerStyle,
                isActivePath(pathname, link.href) && ACTIVE_TRIGGER,
              )}
            >
              <Link
                href={link.href}
                aria-current={isActivePath(pathname, link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
