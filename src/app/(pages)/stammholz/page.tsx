import { FuelCatalog } from "@/components/commerce/fuel-catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stammholz & Meterholz",
  description:
    "Rundholz, Meterscheite und Polterholz mit deklarierter Länge, Holzart und Menge in Ster oder Festmeter.",
};

export default async function StammholzPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <FuelCatalog
      searchParams={await searchParams}
      basePath="/stammholz"
      kind="log"
      title="Stammholz & Meterholz"
      description="Rundholz, Meterscheite und Polterholz zum Selberspalten. Länge, Holzart und Menge in Ster oder Festmeter."
    />
  );
}
