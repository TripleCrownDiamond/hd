import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CartView } from "./cart-view";

export const metadata: Metadata = {
  title: "Warenkorb",
  description: "Ihre ausgewählten Artikel und Zusammenfassung vor der Kasse.",
};

export default function CartPage() {
  return (
    <div className="bg-elevated/40">
      <div className="container-site py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: "Startseite", href: "/" },
            { label: "Warenkorb" },
          ]}
          className="mb-6"
        />
        <h1 className="font-display text-3xl font-semibold text-text md:text-4xl">
          Warenkorb
        </h1>
        <p className="mt-2 text-muted">
          Alle Preise inkl. gesetzlicher MwSt. Versand wird nach PLZ berechnet.
        </p>
        <div className="mt-8">
          <CartView />
        </div>
      </div>
    </div>
  );
}
