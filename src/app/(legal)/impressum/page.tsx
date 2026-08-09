import type { Metadata } from "next";
import { LegalPage } from "@/components/content/legal-page";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Anbieterkennzeichnung nach § 5 DDG.",
};

export default function Page() {
  return <LegalPage slug="impressum" />;
}
