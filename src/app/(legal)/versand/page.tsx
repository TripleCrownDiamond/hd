import type { Metadata } from "next";
import { LegalPage } from "@/components/content/legal-page";

export const metadata: Metadata = {
  title: "Versand und Lieferung",
  description: "Lieferbedingungen, Zonen, Fristen und Kosten.",
};

export default function Page() {
  return <LegalPage slug="versand" />;
}
