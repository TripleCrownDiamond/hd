import { FuelCatalog } from "@/components/commerce/fuel-catalog";

export const dynamic = "force-dynamic";

export default async function HolzbrikettsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <FuelCatalog
      searchParams={await searchParams}
      basePath="/holzbriketts"
      kind="briquette"
      title="Holzbriketts"
      description="Briketts mit deklarierter Menge und Verpackung."
    />
  );
}
