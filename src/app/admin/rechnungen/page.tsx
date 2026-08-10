import Link from "next/link";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { AdminHeader, EmptyAdmin } from "@/components/admin/admin-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InvoiceIssueForm } from "@/components/admin/invoice-issue-form";

export default async function InvoicesAdminPage() {
  const supabase = await getMigrationAwareServerSupabase();
  const [{ data: invoices }, { data: orders }, { data: settings }] = await Promise.all([
    supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("orders").select("id,order_number,customer_name,total_cents,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("site_settings").select("company_name,street,postal_code,city,vat_id,tax_number").eq("id", 1).maybeSingle(),
  ]);
  const invoiced = new Set((invoices ?? []).filter((row) => row.kind === "invoice" && row.status !== "void").map((row) => row.order_id));
  const legalReady = Boolean(settings?.company_name && settings?.street && settings?.postal_code && settings?.city && (settings?.vat_id || settings?.tax_number));

  return <div className="space-y-8"><AdminHeader eyebrow="Finances" title="Factures" description="PDF/A4 avec le logo, les données d'entreprise et le pied légal. Une facture émise et son instantané sont immuables ; les corrections exigent un document séparé." />
    {!legalReady ? <Card><CardContent className="border-amber-500/60 bg-amber-50 pt-6 text-sm"><p className="font-semibold text-amber-800">Données légales incomplètes — l&apos;émission est bloquée tant que ce n&apos;est pas réglé.</p><p className="text-amber-700">Renseignez la raison sociale, l&apos;adresse et la USt-IdNr. ou la Steuernummer dans <Link className="underline" href="/admin/einstellungen">Réglages → Données entreprise</Link>. Sans numéro fiscal, une facture allemande serait invalide.</p></CardContent></Card> : null}
    <Card><CardContent className="pt-6"><h2 className="font-semibold">Émettre une facture</h2><p className="text-muted mt-1 text-sm">Commandes sans facture. Les lignes ajoutées ci-dessous sont incluses dans le PDF ; celles marquées « aussi au site » créent le produit dans le catalogue.</p>
      <div className="mt-4 space-y-2">{(orders ?? []).filter((order) => !invoiced.has(order.id)).map((order) => <div key={order.id} className="rounded-lg border p-3"><InvoiceIssueForm orderId={order.id} orderNumber={order.order_number} customer={order.customer_name} totalCents={order.total_cents} /></div>)}</div>
    </CardContent></Card>
    {!invoices?.length ? <EmptyAdmin>Aucune facture pour le moment.</EmptyAdmin> : <div className="space-y-3">{invoices.map((invoice) => <Card key={invoice.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><p className="font-semibold">{invoice.invoice_number ?? "Brouillon sans numéro"}</p><p className="text-muted text-xs">{invoice.kind} · Commande {invoice.order_id}</p></div><div className="text-right"><Badge>{invoice.status}</Badge><p className="my-2 font-mono">{formatPrice(invoice.gross_cents)}</p>{invoice.status === "issued" ? <Button asChild size="sm" variant="secondary"><a href={`/api/admin/rechnungen/${invoice.id}`}>Télécharger le PDF</a></Button> : null}</div></CardContent></Card>)}</div>}</div>;
}
