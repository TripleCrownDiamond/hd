import type { Metadata } from "next";
import { getPublishedContent, PublishedContent } from "@/components/content/published-content";
import { LegalPlaceholderWarning } from "@/components/content/legal-placeholder-warning";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: "Informationen zur Verarbeitung personenbezogener Daten nach DSGVO.",
  robots: { index: true, follow: true },
};

export default async function DatenschutzPage() {
  const entry = await getPublishedContent("datenschutz");
  if (entry?.kind === "legal") return <PublishedContent entry={entry} />;
  return (
    <>
      <LegalPlaceholderWarning />
      <h1 className="font-display text-3xl font-semibold text-text">Datenschutzerklärung</h1>
      <p className="mt-2 text-sm text-muted">
        Informationen gemäß Art. 13 und 14 DSGVO. Version [x.y] – Stand [Datum].
      </p>

      <div className="mt-8 space-y-6 text-sm text-text">
        <section>
          <h2 className="font-display text-xl font-semibold text-text">Verantwortlicher</h2>
          <p className="mt-2 text-muted">
            [Firmenname], [Anschrift], [E-Mail]. Ansprechperson für den Datenschutz: [Name /
            Datenschutzbeauftragte:r].
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-text">Zwecke und Rechtsgrundlagen</h2>
          <p className="mt-2 text-muted">
            Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO), gesetzliche Aufbewahrungspflichten
            (Art. 6 Abs. 1 lit. c DSGVO), berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO) und
            Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Details werden nach juristischer Prüfung
            ergänzt.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-text">Empfänger und Auftragsverarbeiter</h2>
          <p className="mt-2 text-muted">
            [Hosting], [Supabase], [Stripe/PayPal], [Resend], [Telegram-Notifikationen], [Versanddienstleister].
            Auftragsverarbeitungsverträge (AVV) liegen vor / werden abgeschlossen.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-text">Speicherdauer</h2>
          <p className="mt-2 text-muted">
            Handelsrechtliche und steuerliche Aufbewahrungsfristen (6 bzw. 10 Jahre). Kundenkonten
            werden nach [Zeitraum] Inaktivität gelöscht.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-text">Ihre Rechte</h2>
          <p className="mt-2 text-muted">
            Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch,
            Widerruf erteilter Einwilligungen sowie Beschwerderecht bei der zuständigen
            Aufsichtsbehörde.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold text-text">Cookies und Tracking</h2>
          <p className="mt-2 text-muted">
            Technisch notwendige Cookies werden ohne Einwilligung gesetzt. Für alle weiteren
            Verarbeitungen (Analyse, Marketing) fragen wir vorab eine Einwilligung über unser
            Consent-Banner ab.
          </p>
        </section>
      </div>
    </>
  );
}
