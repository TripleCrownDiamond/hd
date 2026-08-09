import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { getPaymentOptions } from "@/lib/payments/server";
import { CheckoutView } from "./checkout-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kasse",
  description:
    "Lieferadresse angeben, Liefergebiet prüfen und Versandkosten sehen, bevor Sie bestellen.",
  robots: { index: false, follow: false },
};

export default async function KassePage() {
  const paymentOptions = await getPaymentOptions();
  return (
    <div className="bg-elevated/40">
      <div className="container-catalog py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: "Startseite", href: "/" },
            { label: "Warenkorb", href: "/warenkorb" },
            { label: "Kasse" },
          ]}
          className="mb-6"
        />
        <h1 className="font-display text-text mb-6 text-3xl leading-tight font-semibold">Kasse</h1>
        <CheckoutView paymentOptions={paymentOptions} />
      </div>
    </div>
  );
}
