import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { requireAdminAccess } from "@/lib/auth/admin";

const adminNav = [
  { label: "Aperçu", href: "/admin" },
  { label: "Commandes", href: "/admin/bestellungen" },
  { label: "Produits", href: "/admin/produkte" },
  { label: "Clients", href: "/admin/kunden" },
  { label: "Factures", href: "/admin/rechnungen" },
  { label: "Promotions", href: "/admin/rabatte" },
  { label: "FAQ & Chat", href: "/admin/faq" },
  { label: "Pages & Articles", href: "/admin/inhalte" },
  { label: "Avis", href: "/admin/bewertungen" },
  { label: "Paiements", href: "/admin/zahlungen" },
  { label: "Réglages", href: "/admin/einstellungen" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminAccess(["admin", "content_editor", "support", "logistics", "finance"]);
  return (
    <div className="flex min-h-screen bg-elevated/60">
      <aside
        className="hidden w-60 shrink-0 border-r border-border bg-brand text-white lg:flex lg:flex-col"
        aria-label="Navigation admin"
      >
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/admin" className="flex items-center gap-2 tracking-tight">
            <Logo tone="mono" className="h-5 w-auto text-white" />
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest">
              Admin
            </span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-0.5 px-2">
            {adminNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-white/10 px-5 py-4 text-xs text-white/50">
          Vérification des rôles active. MFA à venir.
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
                <Link
                  href={item.href}
                  className="text-muted hover:bg-elevated hover:text-text block whitespace-nowrap rounded-md px-3 py-2 text-sm"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 px-4 py-6 md:px-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}
