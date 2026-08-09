import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection } from "@/components/content/legal-section";
import { StoredDataControls } from "@/components/content/stored-data-controls";

export const metadata: Metadata = {
  title: "Cookie-Einstellungen",
  description: "Welche Daten dieser Shop in Ihrem Browser speichert — und wie Sie sie löschen.",
};

export default function CookieEinstellungenPage() {
  return (
    <>
      <h1 className="font-display text-text text-3xl font-semibold">Cookie-Einstellungen</h1>
      <p className="text-muted mt-2 text-sm">
        Es gibt hier nichts abzuwählen — und das ist der Punkt.
      </p>

      <LegalSection title="Warum kein Banner">
        <p>
          Dieser Shop verwendet <strong>keine</strong> Analyse-, Werbe- oder Tracking-Cookies. Wir
          binden weder Analysedienste noch Werbenetzwerke noch Social-Media-Pixel ein. Gespeichert
          wird ausschließlich, was für den von Ihnen aufgerufenen Dienst technisch erforderlich ist.
        </p>
        <p>
          Für solche Speicherung sieht § 25 Abs. 2 Nr. 2 TDDDG keine Einwilligung vor. Ein
          Consent-Banner, das nur eine Wahl vortäuscht, wäre irreführend — deshalb gibt es keins.
        </p>
      </LegalSection>

      <LegalSection title="Was gespeichert wird">
        <StoredDataControls />
      </LegalSection>

      <LegalSection title="Löschen im Browser">
        <p>
          Unabhängig von der Schaltfläche oben können Sie die Daten jederzeit über die Einstellungen
          Ihres Browsers löschen — dort meist unter „Cookies und Websitedaten“. Nach dem Löschen
          sind Warenkorb, Merkliste und Postleitzahl leer; Ihr Kundenkonto und bereits aufgegebene
          Bestellungen bleiben davon unberührt.
        </p>
        <p>
          Welche Daten wir darüber hinaus auf unseren Servern verarbeiten, steht in der{" "}
          <Link href="/datenschutz" className="text-accent underline">
            Datenschutzerklärung
          </Link>
          .
        </p>
      </LegalSection>
    </>
  );
}
