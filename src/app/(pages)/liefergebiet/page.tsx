import { MapPin, Truck, Package, Clock, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { DeliveryChecker } from "@/components/commerce/delivery-checker";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

const zones = [
  { code: "0 – 30 km", label: "Region Nord", desc: "Werktag+1, ab 39 €" },
  { code: "30 – 100 km", label: "Erweiterte Region", desc: "Werktag+2, ab 59 €" },
  { code: "100 – 250 km", label: "Deutschland Mitte/Süd", desc: "Werktag+3, ab 89 €" },
  { code: "> 250 km", label: "Nach Absprache", desc: "Sprechen Sie uns an" },
];

export default function LiefergebietPage() {
  return (
    <div className="bg-elevated/40">
      <div className="container-site py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: "Startseite", href: "/" },
            { label: "Liefergebiet" },
          ]}
          className="mb-6"
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <h1 className="font-display text-3xl font-semibold leading-tight text-text md:text-4xl">
              Liefergebiet prüfen
            </h1>
            <p className="mt-2 max-w-2xl text-muted">
              Geben Sie Ihre Postleitzahl ein — Sie erhalten sofort Preis, Termin und
              Zufahrtsanforderungen. Kein „vielleicht&ldquo;, keine Nachverhandlung.
            </p>

            <div className="mt-6">
              <DeliveryChecker />
            </div>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Lieferbedingungen</CardTitle>
                <CardDescription>Was Sie bei jeder Lieferung erwarten dürfen.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" defaultValue={["bordstein"]}>
                  <AccordionItem value="bordstein">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <Package className="size-4 text-brand" aria-hidden="true" />
                        Frei Bordsteinkante
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      Die Lieferung erfolgt bis zur Bordsteinkante. Der Fahrer bringt die Ware
                      nicht in den Keller, in die Wohnung oder an den Aufstellungsort.
                      Kranentladung oder Palettenhub sind optional gegen Aufpreis buchbar.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="zufahrt">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <Truck className="size-4 text-brand" aria-hidden="true" />
                        Zufahrt und Gewicht
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      Wir liefern mit einem 40-Tonnen-Fahrzeug. Bei schmalen Straßen, Brücken
                      mit Gewichtsbeschränkung oder verkehrsberuhigten Bereichen kontaktieren
                      Sie uns bitte vorab. Palettenware wird mit LKW mit Ladebordwand geliefert.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="terminierung">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <Clock className="size-4 text-brand" aria-hidden="true" />
                        Terminierung
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      Sie erhalten am Vortag eine SMS mit dem Anlieferzeitfenster (± 2 h).
                      Änderungen bis 48 h vor Lieferung sind kostenfrei.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="oefen">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <Info className="size-4 text-brand" aria-hidden="true" />
                        Lieferung von Kaminöfen
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      Für Kaminöfen bieten wir mehrere Optionen: reine Lieferung,
                      Lieferung mit Montagevermittlung oder Lieferung mit Montage. Details
                      auf der Seite Montage und Inbetriebnahme.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="overflow-hidden p-0">
              <div
                className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-brand via-brand/90 to-brand/70"
                aria-hidden="true"
              >
                <MapPin className="size-20 text-white/60" strokeWidth={1.5} />
              </div>
              <CardContent className="pt-6">
                <CardTitle className="text-base">Lieferzonen</CardTitle>
                <CardDescription className="mt-1">
                  Preise variieren nach Entfernung und Bestellmenge.
                </CardDescription>
                <ul className="mt-4 space-y-3">
                  {zones.map((zone) => (
                    <li key={zone.code} className="flex items-start gap-3">
                      <Badge variant="default" className="mt-0.5 shrink-0 font-mono tabular-nums">
                        {zone.code}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text">{zone.label}</p>
                        <p className="text-xs text-muted">{zone.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Separator className="my-4" />
                <p className="text-xs text-muted">
                  Wir bedienen nicht alle Regionen Deutschlands. Postleitzahl im Rechner prüfen.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
