import { FuelCatalog } from "@/components/commerce/fuel-catalog";

export const dynamic = "force-dynamic";

export default async function BrennholzPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <FuelCatalog
      searchParams={await searchParams}
      basePath="/brennholz"
      kind="wood"
      title="Brennholz"
      description="Kaminholz von geprüften Lieferanten. Klar deklariert nach Holzart, Länge, Restfeuchte und Menge — Angaben stammen direkt von der Quelle."
    />
  );
}
