import type { Metadata } from "next";
import { LegalPage } from "@/components/content/legal-page";

export const metadata: Metadata = {
  title: "Zahlungsarten",
  description: "Übersicht der akzeptierten Zahlungsmethoden.",
};

export default function Page() {
  return <LegalPage slug="zahlung" />;
}
