import Link from "next/link";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { AdminHeader, EmptyAdmin } from "@/components/admin/admin-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InvoiceIssueForm } from "@/components/admin/invoice-issue-form";
import { StandaloneInvoiceForm, type StandaloneProductOption } from "@/components/admin/standalone-invoice-form";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-muted/40 text-muted border-muted/30",
  issued: "bg-green-100 text-green-800 border-green-300",
  void: "bg-red-100 text-red-800 border-red-300",
};

export default async function InvoicesAdminPage() {
  const supabase = await getMigrationAwareServerSupabase();
  const [{ data: invoices }, { data: orders }, { data: settings }, { data: products }] = await Promise.all([
    supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("orders").select("id,order_number,customer_name,total_cents,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("site_settings").select("company_name,street,postal_code,city,vat_id,tax_number").eq("id", 1).maybeSingle(),
    supabase
      .from("products")
      .select("id,model,price_cents_public")
      .eq("is_published", true)
      .not("price_cents_public", "is", null)
      .order("model", { ascending: true })
      .limit(500),
  ]);
  const invoiced = new Set((invoices ?? []).filter((row) => row.kind === "invoice" && row.status !== "void" && row.order_id).map((row) => row.order_id));
  const legalReady = Boolean(settings?.company_name && settings?.street && settings?.postal_code && settings?.city && (settings?.vat_id || settings?.tax_number));
  const productOptions: StandaloneProductOption[] = (products ?? []).map((product) => ({
    id: String(product.id),
    name: String(product.model ?? "Produit"),
    priceCents: Number(product.price_cents_public ?? 0),
  }));

  return <div className="space-y-8"><AdminHeader eyebrow="Finances" title="Factures" description="PDF/A4 avec le logo, les données d'entreprise et le pied légal. Une facture émise et son instantané sont immuables ; les corrections exigent un document séparé." />
    {!legalReady ? <Card><CardContent className="border-amber-500/60 bg-amber-50 pt-6 text-sm"><p className="font-semibold text-amber-800">Données légales incomplètes — l&apos;émission est bloquée tant que ce n&apos;est pas réglé.</p><p className="text-amber-700">Renseignez la raison sociale, l&apos;adresse et la USt-IdNr. ou la Steuernummer dans <Link className="underline" href="/admin/einstellungen">Réglages → Données entreprise</Link>. Sans numéro fiscal, une facture allemande serait invalide.</p></CardContent></Card> : null}
    <Card><CardContent className="pt-6"><h2 className="font-semibold">Facture sans commande</h2><p className="text-muted mt-1 text-sm">Pour une vente conclue à la main, par téléphone ou au dépôt : aucun ordre n&apos;est requis. Les lignes viennent du catalogue ou sont saisies librement — y compris un produit entièrement nouveau, avec l&apos;option de le publier au site.</p>
      <StandaloneInvoiceForm products={productOptions} />
    </CardContent></Card>
    <Card><CardContent className="pt-6"><h2 className="font-semibold">Émettre la facture d&apos;une commande</h2><p className="text-muted mt-1 text-sm">Commandes sans facture. Les lignes ajoutées ci-dessous sont incluses dans le PDF ; celles marquées « aussi au site » créent le produit dans le catalogue.</p>
      <div className="mt-4 space-y-2">{(orders ?? []).filter((order) => !invoiced.has(order.id)).map((order) => <div key={order.id} className="rounded-lg border p-3"><InvoiceIssueForm orderId={order.id} orderNumber={order.order_number} customer={order.customer_name} totalCents={order.total_cents} /></div>)}</div>
    </CardContent></Card>
    {!invoices?.length ? <EmptyAdmin>Aucune facture pour le moment.</EmptyAdmin> : <div className="space-y-3">{invoices.map((invoice) => <Card key={invoice.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><p className="font-semibold">{invoice.invoice_number ?? "Brouillon sans numéro"}</p><p className="text-muted text-xs">{invoice.kind}{invoice.order_id ? <> · Commande {invoice.order_id}</> : " · Sans commande"}</p></div><div className="text-right"><Badge className={STATUS_STYLE[invoice.status] ?? ""}>{invoice.status}</Badge><p className="my-2 font-mono">{formatPrice(invoice.gross_cents)}</p>{invoice.status === "issued" ? <Button asChild size="sm" variant="secondary"><a href={`/api/admin/rechnungen/${invoice.id}`}>Télécharger le PDF</a></Button> : null}</div></CardContent></Card>)}</div>}</div>;
}
