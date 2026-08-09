import type { Metadata } from "next";
import { getPublishedContent, PublishedContent } from "@/components/content/published-content";
import { LegalPlaceholderWarning } from "@/components/content/legal-placeholder-warning";

export const metadata: Metadata = {
  title: "Widerrufsbelehrung",
  description: "Ihr Widerrufsrecht als Verbraucher:in bei HolzDirekt.",
};

export default async function WiderrufPage() {
  const entry = await getPublishedContent("widerruf");
  if (entry?.kind === "legal") return <PublishedContent entry={entry} />;
  return (
    <>
      <LegalPlaceholderWarning />
      <h1 className="font-display text-3xl font-semibold text-text">Widerrufsbelehrung</h1>
      <p className="mt-2 text-sm text-muted">
        Muster-Widerrufsbelehrung nach Anlage 1 zu Artikel 246a EGBGB. Anzupassen nach
        juristischer Prüfung.
      </p>

      <section className="mt-8 space-y-4 text-sm text-text">
        <h2 className="font-display text-xl font-semibold text-text">Widerrufsrecht</h2>
        <p>
          Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu
          widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein
          von Ihnen benannter Dritter, der nicht der Beförderer ist, die letzte Ware in Besitz
          genommen haben bzw. hat.
        </p>
        <p>
          Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ([Firmenname, Anschrift, E-Mail]) mittels
          einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail)
          über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das
          beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
        </p>
      </section>

      <section className="mt-8 space-y-4 text-sm text-text">
        <h2 className="font-display text-xl font-semibold text-text">Folgen des Widerrufs</h2>
        <p>
          Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen
          erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten,
          die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns
          angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens
          binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren
          Widerruf dieses Vertrags bei uns eingegangen ist.
        </p>
        <p>
          Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder
          bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem,
          welches der frühere Zeitpunkt ist.
        </p>
      </section>

      <section className="mt-8 space-y-2 text-sm text-text">
        <h2 className="font-display text-xl font-semibold text-text">
          Muster-Widerrufsformular
        </h2>
        <p className="text-muted">
          Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden
          Sie es zurück:
        </p>
        <pre className="mt-2 whitespace-pre-wrap rounded-md border border-border bg-elevated p-4 font-mono text-xs text-text">{`An: [Firma, Anschrift, E-Mail]
Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über
den Kauf der folgenden Waren (*) / die Erbringung der folgenden Dienstleistung (*):

— Bestellt am (*) / erhalten am (*):
— Name des/der Verbraucher(s):
— Anschrift des/der Verbraucher(s):
— Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):
— Datum:

(*) Unzutreffendes streichen.`}</pre>
      </section>
    </>
  );
}
