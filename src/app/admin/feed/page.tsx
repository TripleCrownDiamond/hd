import Link from "next/link";
import { Download, FileCode2, Info } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedCopyButton } from "@/components/admin/feed-copy-button";
import { countMerchantFeedProducts } from "@/lib/products/merchant-feed";
import { siteBaseUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function MerchantFeedAdminPage() {
  const baseUrl = siteBaseUrl();
  const feedUrl = `${baseUrl}/feed/merchants.xml`;
  const productCount = await countMerchantFeedProducts();

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Export"
        title="Feed marchand (XML)"
        description="Génère le flux de produits destiné aux places de marché et aux comparateurs de prix (Google Shopping, Idealo, Billiger, …). Le XML est reconstruit à partir du catalogue actuel à chaque accès."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode2 className="size-4" />
            URL du flux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-border bg-elevated rounded-md border p-3">
            <p className="text-text font-mono text-sm break-all">{feedUrl}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <FeedCopyButton url={feedUrl} />
            <Button asChild variant="secondary">
              <Link href="/feed/merchants.xml" target="_blank" rel="noopener noreferrer">
                <Download className="size-4" />
                Télécharger le XML
              </Link>
            </Button>
          </div>
          <p className="text-muted text-sm">
            {productCount} produits publiés avec un prix sont inclus. Les articles
            « Sur devis » et les produits hors ligne sont exclus.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="size-4" />
            À savoir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-muted list-disc space-y-2 pl-5 text-sm">
            <li>
              Le flux utilise le format RSS 2.0 avec les attributs Google Shopping
              (<code className="text-text">g:title</code>,{" "}
              <code className="text-text">g:price</code>,{" "}
              <code className="text-text">g:availability</code>…), accepté par la
              quasi-totalité des plateformes.
            </li>
            <li>
              Le prix est le prix TTC affiché en boutique, converti en centimes →
              euros. Quantité vendue et Grundpreis figurent dans la description.
            </li>
            <li>
              Chaque modification en admin est reflétée immédiatement : le flux
              n&apos;est jamais servi depuis un cache. Les plateformes peuvent le
              rafraîchir plusieurs fois par jour sans risque de données obsolètes.
            </li>
            <li>
              Il reste public (aucune authentification) : c&apos;est le mécanisme
              par lequel les places de marché viennent chercher les produits.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}