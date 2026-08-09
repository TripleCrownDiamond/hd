import { Card, CardContent } from "@/components/ui/card";

export function CatalogEmptyState({
  title = "Noch keine Produkte verfügbar",
  description = "Der Katalog wird derzeit geprüft. Bitte versuchen Sie es später erneut.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="sm:col-span-2 xl:col-span-3">
      <CardContent className="py-12 text-center">
        <h2 className="font-display text-xl font-semibold text-text">{title}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{description}</p>
      </CardContent>
    </Card>
  );
}
