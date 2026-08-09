import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TrackingView } from "./tracking-view";

export const metadata = {
  title: "Bestellung verfolgen",
  description: "Status und Sendungsverfolgung Ihrer Bestellung mit Bestellnummer und E-Mail abrufen.",
  robots: { index: false, follow: false },
};

export default function TrackingPage() {
  return (
    <div className="bg-elevated/40">
      <div className="container-catalog py-8 md:py-12">
        <Breadcrumbs
          items={[{ label: "Startseite", href: "/" }, { label: "Bestellung verfolgen" }]}
          className="mb-6"
        />
        <h1 className="font-display text-text text-3xl leading-tight font-semibold">
          Bestellung verfolgen
        </h1>
        <p className="text-muted mt-2 mb-8 max-w-2xl">
          Geben Sie Ihre Bestellnummer und die bei der Bestellung verwendete E-Mail-Adresse ein.
        </p>
        <TrackingView />
      </div>
    </div>
  );
}
