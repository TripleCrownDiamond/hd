import type { Metadata } from "next";
import { getPublishedContent, PublishedContent } from "@/components/content/published-content";
import { LegalPlaceholderWarning } from "@/components/content/legal-placeholder-warning";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Anbieterkennzeichnung nach § 5 DDG.",
  robots: { index: false, follow: false },
};

export default async function ImpressumPage() {
  const entry = await getPublishedContent("impressum");
  if (entry?.kind === "legal") return <PublishedContent entry={entry} />;
  return (
    <>
      <LegalPlaceholderWarning />
      <h1 className="font-display text-3xl font-semibold text-text">Impressum</h1>
      <p className="mt-2 text-sm text-muted">Angaben gemäß § 5 DDG.</p>

      <section className="mt-8 space-y-2 text-sm text-text">
        <p>[Firmenname / Rechtsform]</p>
        <p>[Straße und Hausnummer]</p>
        <p>[PLZ Ort]</p>
        <p>Deutschland</p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-text">Vertreten durch</h2>
        <p className="mt-2 text-sm text-text">[Vertretungsberechtigte Person]</p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-text">Kontakt</h2>
        <dl className="mt-2 space-y-1 text-sm text-text">
          <div>
            <dt className="inline font-medium">Telefon: </dt>
            <dd className="inline">[+49 …]</dd>
          </div>
          <div>
            <dt className="inline font-medium">E-Mail: </dt>
            <dd className="inline">[kontakt@…]</dd>
          </div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-text">Handelsregister</h2>
        <p className="mt-2 text-sm text-text">
          Registergericht: [Amtsgericht …], Registernummer: [HRB …]
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-text">Umsatzsteuer-ID</h2>
        <p className="mt-2 text-sm text-text">
          Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: [DE …]
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-text">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </h2>
        <p className="mt-2 text-sm text-text">[Name, Anschrift]</p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-text">Streitschlichtung</h2>
        <p className="mt-2 text-sm text-text">
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            className="text-accent underline"
            rel="noreferrer noopener"
            target="_blank"
          >
            ec.europa.eu/consumers/odr
          </a>
          . Wir sind [nicht] bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>
    </>
  );
}
