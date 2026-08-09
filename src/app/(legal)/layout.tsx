import type { ReactNode } from "react";
import Link from "next/link";

const legalNav = [
  { label: "Impressum", href: "/impressum" },
  { label: "Allgemeine Geschäftsbedingungen", href: "/agb" },
  { label: "Datenschutzerklärung", href: "/datenschutz" },
  { label: "Widerrufsbelehrung", href: "/widerruf" },
  { label: "Versand und Lieferung", href: "/versand" },
  { label: "Zahlungsarten", href: "/zahlung" },
];

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-elevated/40 py-8 md:py-14">
      <div className="container-site">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside aria-label="Rechtliche Informationen" className="lg:sticky lg:top-24 lg:self-start">
            <nav className="rounded-xl border border-border bg-surface p-3 shadow-sm">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Rechtliche Hinweise
              </p>
              <ul className="space-y-0.5">
                {legalNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-md px-2 py-2 text-sm text-muted transition-colors hover:bg-elevated hover:text-text focus-visible:bg-elevated focus-visible:text-text"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
          <article className="container-legal rounded-xl border border-border bg-surface p-6 shadow-sm md:p-10">
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
