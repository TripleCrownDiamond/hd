import type { Metadata } from "next";
import { getPublishedContent, PublishedContent } from "@/components/content/published-content";
import { LegalPlaceholderWarning } from "@/components/content/legal-placeholder-warning";
import {
  FREE_SHIPPING_FROM_CENTS,
  ISLAND_SURCHARGE_CENTS,
  SHIPPING_RATES,
} from "@/lib/shipping/rates";
import { POSTCODE_COUNT } from "@/lib/shipping/postcodes";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Versand und Lieferung",
  description: "Lieferbedingungen, Zonen, Fristen und Kosten.",
};

export default async function VersandPage() {
  const entry = await getPublishedContent("versand");
  if (entry?.kind === "legal") return <PublishedContent entry={entry} />;
  return (
    <>
      <LegalPlaceholderWarning />
      <h1 className="font-display text-3xl font-semibold text-text">Versand und Lieferung</h1>
      <p className="mt-2 text-sm text-muted">
        Diese Seite dokumentiert Lieferzonen, Transporteure und Fristen. Zahlen sind Platzhalter
        und werden nach Freigabe durch den zuständigen Speditionsdienstleister ersetzt.
      </p>

      <section className="mt-8 space-y-3 text-sm text-text">
        <h2 className="font-display text-xl font-semibold text-text">Liefergebiet</h2>
        <p className="text-muted">
          Wir liefern an jede der {POSTCODE_COUNT.toLocaleString("de-DE")} deutschen
          Postleitzahlen. Ihre Adresse wird im Warenkorb und an der Kasse gegen das
          Postleitzahlenverzeichnis geprüft; Lieferungen ins Ausland sind derzeit nicht möglich.
        </p>
        <p className="text-muted">
          Deutsche Inseln ohne Straßenanbindung — unter anderem Sylt, Föhr, Amrum, Helgoland,
          die Ostfriesischen Inseln und Hiddensee — werden per Fähre oder Autozug beliefert.
          Rügen, Usedom, Fehmarn und Poel sind über Brücke oder Damm angebunden und gelten als
          Festland.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm text-text">
        <h2 className="font-display text-xl font-semibold text-text">Fristen</h2>
        <p className="text-muted">
          Sofern nicht anders in der Produktbeschreibung angegeben, beträgt die Lieferfrist [x] bis
          [y] Werktage nach Zahlungseingang.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm text-text">
        <h2 className="font-display text-xl font-semibold text-text">Ablade- und Zufahrtsbedingungen</h2>
        <p className="text-muted">
          Lieferung erfolgt bis zur Bordsteinkante. Der Kunde stellt eine befahrbare Zufahrt sowie
          eine Ablademöglichkeit sicher. Abweichungen (Kran, Silobefüllung, Palettenhub) sind vorab
          zu vereinbaren.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm text-text">
        <h2 className="font-display text-xl font-semibold text-text">Versandkosten</h2>
        <p className="text-muted">
          Pauschale je Bestellung, nicht je Position: eine Bestellung ist eine Sendung und zahlt
          den höchsten enthaltenen Satz einmal.
        </p>
        <ul className="text-muted list-disc space-y-1 pl-5">
          <li>
            Paketversand (Zubehör, Anzündholz):{" "}
            <span className="text-text font-mono tabular-nums">
              {formatPrice(SHIPPING_RATES.parcel)}
            </span>
          </li>
          <li>
            Speditionsversand Palette, frei Bordsteinkante (Brennholz, Pellets, Briketts, Kohle):{" "}
            <span className="text-text font-mono tabular-nums">
              {formatPrice(SHIPPING_RATES.freight)}
            </span>
          </li>
          <li>
            Speditionsversand mit Hebebühne (Kaminöfen):{" "}
            <span className="text-text font-mono tabular-nums">
              {formatPrice(SHIPPING_RATES.bulky)}
            </span>
          </li>
          <li>
            Inselzuschlag für Speditionssendungen:{" "}
            <span className="text-text font-mono tabular-nums">
              {formatPrice(ISLAND_SURCHARGE_CENTS)}
            </span>{" "}
            (Pakete ohne Zuschlag)
          </li>
        </ul>
        <p className="text-text font-medium">
          Ab einem Bestellwert von{" "}
          <span className="font-mono tabular-nums">{formatPrice(FREE_SHIPPING_FROM_CENTS)}</span>{" "}
          liefern wir versandkostenfrei bis zur Haustür — Inselzuschlag inklusive.
        </p>
      </section>
    </>
  );
}
