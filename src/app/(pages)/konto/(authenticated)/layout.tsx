import type { ReactNode } from "react";
import Link from "next/link";

const accountNav = [
  { label: "Übersicht", href: "/konto" },
  { label: "Bestellungen", href: "/konto/bestellungen" },
  { label: "Merkliste", href: "/konto/favoriten" },
  { label: "Adressen", href: "/konto/adressen" },
  { label: "Einstellungen", href: "/konto/einstellungen" },
];

export default function AuthenticatedAccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container-site py-8 md:py-12">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside aria-label="Kontonavigation" className="md:sticky md:top-24 md:self-start">
          <nav className="rounded-xl border border-border bg-surface p-2 shadow-sm">
            <ul className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
              {accountNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-elevated hover:text-text focus-visible:bg-elevated focus-visible:text-text"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
