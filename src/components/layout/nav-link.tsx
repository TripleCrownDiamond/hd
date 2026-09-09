"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * A link that knows whether it points at the page you are on.
 *
 * Section roots (`/admin`, `/konto`) must match exactly — treating them as
 * prefixes would light up "Aperçu" on every single admin page and leave the
 * reader with no idea where they actually are. Everything else matches its own
 * subtree so `/admin/produkte/<id>` still highlights "Produits".
 */
export function isActivePath(pathname: string, href: string, exact = false): boolean {
  if (pathname === href) return true;
  if (exact) return false;
  return pathname.startsWith(`${href}/`);
}

type NavLinkProps = ComponentProps<typeof Link> & {
  href: string;
  /** Class list applied in both states. */
  className?: string;
  /** Added only when the link is the current page. */
  activeClassName?: string;
  /** Added only when it is not. */
  inactiveClassName?: string;
  /** Match the href exactly instead of its whole subtree. */
  exact?: boolean;
};

export function NavLink({
  href,
  className,
  activeClassName,
  inactiveClassName,
  exact,
  ...props
}: NavLinkProps) {
  const pathname = usePathname() ?? "";
  const active = isActivePath(pathname, href, exact);
  return (
    <Link
      href={href}
      // Announces the current page to screen readers, which cannot see the
      // colour change that conveys it to everyone else.
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : undefined}
      className={cn(className, active ? activeClassName : inactiveClassName)}
      {...props}
    />
  );
}
