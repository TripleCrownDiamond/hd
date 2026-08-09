import type { Metadata } from "next";
import { LegalPage } from "@/components/content/legal-page";

export const metadata: Metadata = {
  title: "Widerrufsbelehrung",
  description: "Ihr Widerrufsrecht als Verbraucher:in.",
};

export default function Page() {
  return <LegalPage slug="widerruf" />;
}
