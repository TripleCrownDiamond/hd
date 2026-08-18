import { FuelCatalog } from "@/components/commerce/fuel-catalog";

export const dynamic = "force-dynamic";

export default async function HolzpelletsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <FuelCatalog
      searchParams={await searchParams}
      basePath="/holzpellets"
      kind="pellet"
      title="Holzpellets"
      description="Pellets mit deklarierter Menge und Verpackung."
    />
  );
}
