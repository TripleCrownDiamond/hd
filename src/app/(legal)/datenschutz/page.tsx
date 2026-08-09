import type { Metadata } from "next";
import { LegalPage } from "@/components/content/legal-page";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: "Informationen zur Verarbeitung personenbezogener Daten nach DSGVO.",
};

export default function Page() {
  return <LegalPage slug="datenschutz" />;
}
