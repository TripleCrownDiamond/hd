import Link from "next/link";
import { Package, Heart, MapPin, Settings, ArrowRight, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const tiles = [
  {
    label: "Meine Bestellungen",
    href: "/konto/bestellungen",
    icon: Package,
    desc: "Aktive und vergangene Bestellungen",
  },
  {
    label: "Merkliste",
    href: "/konto/favoriten",
    icon: Heart,
    desc: "Gemerkte Produkte für später",
  },
  {
    label: "Adressen",
    href: "/konto/adressen",
    icon: MapPin,
    desc: "Liefer- und Rechnungsadressen",
  },
  {
    label: "Einstellungen",
    href: "/konto/einstellungen",
    icon: Settings,
    desc: "Persönliche Daten und Benachrichtigungen",
  },
];

export default function AccountPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted">Willkommen zurück</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-text">
          Ihr Kundenkonto
        </h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Letzte Bestellung</CardTitle>
            <CardDescription>Übersicht über Ihre aktuellste Bestellung.</CardDescription>
          </div>
          <Badge variant="info">In Vorbereitung</Badge>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted">Bestellnummer</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums text-text">
                HK-2026-000482
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Datum</dt>
              <dd className="text-sm font-medium text-text">24. Juli 2026</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Summe</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums text-text">
                389,00 €
              </dd>
            </div>
          </dl>
          <Separator className="my-4" />
          <p className="text-sm text-muted">
            2 Positionen · Voraussichtliche Lieferung 6.–8. August 2026.
          </p>
        </CardContent>
        <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
          <Button asChild variant="secondary" size="sm">
            <Link href="/sendungsverfolgung">Sendung verfolgen</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/konto/bestellungen">
              Alle Bestellungen
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Card>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-text">Schnellzugriff</h2>
          <Link
            href="/konto/einstellungen"
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
          >
            <Bell className="size-3.5" />
            Benachrichtigungen
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => (
            <Link
              key={tile.label}
              href={tile.href}
              className="group focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 focus-visible:rounded-xl"
            >
              <Card className="h-full transition-all duration-base ease-spring group-hover:-translate-y-0.5 group-hover:border-brand/30 group-hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-brand/5">
                    <tile.icon className="size-5 text-brand" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-base font-semibold text-text">
                    {tile.label}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{tile.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm text-accent transition-transform group-hover:translate-x-0.5">
                    Öffnen
                    <ArrowRight className="size-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
