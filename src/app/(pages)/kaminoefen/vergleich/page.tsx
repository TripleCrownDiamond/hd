import { StoveComparison } from "@/components/commerce/stove-comparison";

export const metadata = {
  title: "Kaminöfen vergleichen",
  description:
    "Vergleichen Sie bis zu vier Kaminöfen nach Leistung, Wirkungsgrad, Abmessungen und Gewicht.",
};

export default function VergleichPage() {
  return <StoveComparison />;
}
