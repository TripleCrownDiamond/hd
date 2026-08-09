import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedContent, PublishedContent } from "@/components/content/published-content";
import { LegalPlaceholderWarning } from "@/components/content/legal-placeholder-warning";

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen",
  description: "Geltende Vertragsbedingungen für Bestellungen bei HolzDirekt.",
  robots: { index: true, follow: true },
};

export default async function AgbPage() {
  const entry = await getPublishedContent("agb");
  if (entry?.kind === "legal") return <PublishedContent entry={entry} />;
  return (
    <>
      <LegalPlaceholderWarning />
      <h1 className="font-display text-3xl font-semibold text-text">
        Allgemeine Geschäftsbedingungen
      </h1>
      <p className="mt-2 text-sm text-muted">Version [x.y] – Stand [Datum].</p>

      <p className="mt-6 text-sm text-text">
        Diese Vertragsbedingungen sind Platzhalter und müssen vor Inbetriebnahme durch eine
        deutsche Fachanwaltskanzlei geprüft und freigegeben werden.
      </p>

      <ol className="mt-8 space-y-6 text-sm text-text">
        <li>
          <h2 className="font-display text-xl font-semibold text-text">1. Geltungsbereich</h2>
          <p className="mt-2 text-muted">[Platzhalter]</p>
        </li>
        <li>
          <h2 className="font-display text-xl font-semibold text-text">2. Vertragsschluss</h2>
          <p className="mt-2 text-muted">[Platzhalter]</p>
        </li>
        <li>
          <h2 className="font-display text-xl font-semibold text-text">3. Preise und Zahlung</h2>
          <p className="mt-2 text-muted">[Platzhalter]</p>
        </li>
        <li>
          <h2 className="font-display text-xl font-semibold text-text">4. Lieferung</h2>
          <p className="mt-2 text-muted">[Platzhalter]</p>
        </li>
        <li>
          <h2 className="font-display text-xl font-semibold text-text">5. Eigentumsvorbehalt</h2>
          <p className="mt-2 text-muted">[Platzhalter]</p>
        </li>
        <li>
          <h2 className="font-display text-xl font-semibold text-text">6. Gewährleistung</h2>
          <p className="mt-2 text-muted">[Platzhalter]</p>
        </li>
        <li>
          <h2 className="font-display text-xl font-semibold text-text">7. Widerrufsrecht</h2>
          <p className="mt-2 text-muted">
            Siehe separate <Link className="text-accent underline" href="/widerruf">Widerrufsbelehrung</Link>.
          </p>
        </li>
        <li>
          <h2 className="font-display text-xl font-semibold text-text">8. Datenschutz</h2>
          <p className="mt-2 text-muted">
            Siehe <Link className="text-accent underline" href="/datenschutz">Datenschutzerklärung</Link>.
          </p>
        </li>
        <li>
          <h2 className="font-display text-xl font-semibold text-text">
            9. Anwendbares Recht, Gerichtsstand
          </h2>
          <p className="mt-2 text-muted">[Platzhalter]</p>
        </li>
      </ol>
    </>
  );
}
