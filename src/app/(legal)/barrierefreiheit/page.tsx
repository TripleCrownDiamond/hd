import type { Metadata } from "next";
import { LegalPage } from "@/components/content/legal-page";

export const metadata: Metadata = {
  title: "Erklärung zur Barrierefreiheit",
  description: "Barrierefreiheitserklärung nach BFSG.",
};

export default function Page() {
  return <LegalPage slug="barrierefreiheit" />;
}
