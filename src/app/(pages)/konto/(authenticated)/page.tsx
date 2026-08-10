import Link from "next/link";
import { Heart, PackageSearch, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const tiles = [
  {
    label: "Merkliste",
    href: "/konto/favoriten",
    icon: Heart,
    desc: "Gemerkte Produkte für später",
  },
  {
    label: "Sendung verfolgen",
    href: "/bestellung/verfolgen",
    icon: PackageSearch,
    desc: "Status einer Bestellung anhand der Bestellnummer abrufen",
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

      <div>
        <h2 className="font-display mb-4 text-xl font-semibold text-text">Schnellzugriff</h2>
        <div className="grid gap-4 sm:grid-cols-2">
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
