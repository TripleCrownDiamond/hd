import type { ReactNode } from "react";
import Link from "next/link";

const legalNav = [
  { label: "Impressum", href: "/impressum" },
  { label: "Allgemeine Geschäftsbedingungen", href: "/agb" },
  { label: "Datenschutzerklärung", href: "/datenschutz" },
  { label: "Widerrufsbelehrung", href: "/widerruf" },
  { label: "Muster-Widerrufsformular", href: "/widerrufsformular" },
  { label: "Versand und Lieferung", href: "/versand" },
  { label: "Zahlungsarten", href: "/zahlung" },
  { label: "Barrierefreiheit", href: "/barrierefreiheit" },
  { label: "Cookie-Einstellungen", href: "/cookie-einstellungen" },
];

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-elevated/40 py-8 md:py-14">
      <div className="container-site">
        {/* `minmax(0,1fr)` rather than `1fr`: a bare `1fr` track has an
            automatic minimum, so its widest child sets the floor and a wide
            table drags the whole page past the viewport. */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
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
          {/* `w-full` is load-bearing. `container-legal` sets margin-inline:auto,
              and auto margins stop a grid item stretching — it falls back to
              shrink-to-fit and is sized by its widest content, so the fenced
              Widerrufsformular made a 343px track render 563px wide and pushed
              a band of white off the right of every phone. An explicit width
              leaves the auto margins nothing to absorb; max-width still applies
              on wide screens. */}
          <article className="container-legal w-full min-w-0 rounded-xl border border-border bg-surface p-6 shadow-sm md:p-10">
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
