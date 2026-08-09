import type { Metadata } from "next";
import { getPublishedContent, PublishedContent } from "@/components/content/published-content";
import { LegalPlaceholderWarning } from "@/components/content/legal-placeholder-warning";

export const metadata: Metadata = {
  title: "Zahlungsarten",
  description: "Übersicht der akzeptierten Zahlungsmethoden.",
};

export default async function ZahlungPage() {
  const entry = await getPublishedContent("zahlung");
  if (entry?.kind === "legal") return <PublishedContent entry={entry} />;
  return (
    <>
      <LegalPlaceholderWarning />
      <h1 className="font-display text-3xl font-semibold text-text">Zahlungsarten</h1>
      <p className="mt-2 text-sm text-muted">
        Wir bieten je nach Warenkorb folgende Zahlungsmethoden an. Die konkrete Auswahl kann sich
        nach Freigabe der Zahlungsdienstleister ändern.
      </p>

      <ul className="mt-8 space-y-4 text-sm text-text">
        <li>
          <strong className="font-semibold">Kreditkarte / Wallets:</strong> abgewickelt über
          [Stripe] – Karten der Marken Visa, Mastercard, American Express. 3-D-Secure zwingend.
        </li>
        <li>
          <strong className="font-semibold">PayPal:</strong> [aktiv / geplant]. Käuferschutz nach
          PayPal-Bedingungen.
        </li>
        <li>
          <strong className="font-semibold">Vorkasse per Überweisung:</strong> Versand nach
          Zahlungseingang. Die Bankverbindung erhalten Sie mit der Bestellbestätigung.
        </li>
        <li>
          <strong className="font-semibold">Barzahlung / EC-Karte bei Selbstabholung:</strong>{" "}
          [nur wenn Abholstation existiert].
        </li>
      </ul>

      <p className="mt-8 text-sm text-muted">
        Zahlungsdaten werden ausschließlich verschlüsselt an den jeweiligen Zahlungsdienstleister
        übertragen. HolzDirekt speichert weder Kartennummern noch PINs.
      </p>
    </>
  );
}
