import type { ReactNode } from "react";
import Link from "next/link";
import {
  BadgePercent,
  FileText,
  LayoutDashboard,
  MessageCircleQuestion,
  Newspaper,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { NavLink } from "@/components/layout/nav-link";
import { requireAdminAccess } from "@/lib/auth/admin";

// `exact` on the dashboard only: every other route is a prefix of nothing, so
// they can light up for their own detail pages (/admin/produkte/<id>).
const adminNav = [
  { label: "Aperçu", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Commandes", href: "/admin/bestellungen", icon: ShoppingCart },
  { label: "Produits", href: "/admin/produkte", icon: Package },
  { label: "Clients", href: "/admin/kunden", icon: Users },
  { label: "Factures", href: "/admin/rechnungen", icon: Receipt },
  { label: "Promotions", href: "/admin/rabatte", icon: BadgePercent },
  { label: "FAQ & Chat", href: "/admin/faq", icon: MessageCircleQuestion },
  { label: "Pages & Articles", href: "/admin/inhalte", icon: Newspaper },
  { label: "Avis", href: "/admin/bewertungen", icon: Star },
  { label: "Paiements", href: "/admin/zahlungen", icon: Wallet },
  { label: "Réglages", href: "/admin/einstellungen", icon: Settings },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminAccess(["admin", "content_editor", "support", "logistics", "finance"]);
  return (
    <div className="bg-elevated/60 flex min-h-screen">
      <aside
        className="border-border bg-brand hidden w-60 shrink-0 border-r text-white lg:flex lg:flex-col"
        aria-label="Navigation admin"
      >
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/admin" className="flex items-center gap-2 tracking-tight">
            <Logo tone="mono" className="h-5 w-auto text-white" />
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium tracking-widest uppercase">
              Admin
            </span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-0.5 px-2">
            {adminNav.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  exact={item.exact}
                  className="relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors"
                  activeClassName="bg-white/15 font-semibold text-white before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-accent"
                  inactiveClassName="text-white/70 hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white"
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <Link
            href="/"
            className="text-xs text-white/60 underline-offset-2 hover:text-white hover:underline"
          >
            ← Retour à la boutique
          </Link>
          <p className="mt-2 text-xs text-white/40">Vérification des rôles active. MFA à venir.</p>
        </div>
      </aside>
      <main id="admin-main" className="min-w-0 flex-1 overflow-x-hidden">
        <nav
          className="border-border bg-surface overflow-x-auto border-b lg:hidden"
          aria-label="Navigation admin"
        >
          <ul className="flex min-w-max gap-1 p-2">
            {adminNav.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  exact={item.exact}
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors"
                  activeClassName="bg-brand font-semibold text-white"
                  inactiveClassName="text-muted hover:bg-elevated hover:text-text"
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 px-4 py-6 md:px-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}
