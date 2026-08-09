import { FuelCatalog } from "@/components/commerce/fuel-catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kohle & Grillkohle",
  description:
    "Braunkohle- und Steinkohlebriketts, Anthrazit und Grillkohle mit deklarierter Körnung und Gebindegröße.",
};

export default async function KohlePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <FuelCatalog
      searchParams={await searchParams}
      basePath="/kohle"
      kind="coal"
      title="Kohle & Grillkohle"
      description="Braunkohle, Steinkohle, Anthrazit und Grillkohle. Körnung, Gebinde und Menge stammen direkt von der Lieferantenquelle."
    />
  );
}
