import type { Metadata } from "next";
import { LegalPage } from "@/components/content/legal-page";

export const metadata: Metadata = {
  title: "Muster-Widerrufsformular",
  description: "Formular zur Ausübung des Widerrufsrechts.",
};

export default function Page() {
  return <LegalPage slug="widerrufsformular" />;
}
