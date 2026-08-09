import { FuelCatalog } from "@/components/commerce/fuel-catalog";

export const dynamic = "force-dynamic";

export default async function AnzuendholzPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <FuelCatalog
      searchParams={await searchParams}
      basePath="/anzuendholz"
      kind="kindling"
      title="Anzündholz"
      description="Anzünd- und Anfeuerholz in Sack, Netz oder Karton. Angaben zu Holzart und Menge stammen direkt von der Lieferantenquelle."
    />
  );
}
