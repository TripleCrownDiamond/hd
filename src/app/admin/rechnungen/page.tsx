import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { AdminHeader, EmptyAdmin } from "@/components/admin/admin-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { issueInvoice } from "../actions";

export default async function InvoicesAdminPage() {
  const supabase = await getMigrationAwareServerSupabase();
  const [{ data: invoices }, { data: orders }] = await Promise.all([supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(100), supabase.from("orders").select("id,order_number,customer_name,total_cents,created_at").order("created_at", { ascending: false }).limit(100)]); const invoiced = new Set((invoices ?? []).filter((row) => row.kind === "invoice" && row.status !== "void").map((row) => row.order_id));
  return <div className="space-y-8"><AdminHeader eyebrow="Finanzen" title="Rechnungen" description="PDF/A4 mit dynamischen Firmendaten. Eine ausgestellte Rechnung und ihr Snapshot sind unveränderlich; Korrekturen brauchen ein separates Dokument." />
    <Card><CardContent className="pt-6"><h2 className="font-semibold">Rechnung ausstellen</h2><div className="mt-4 space-y-2">{(orders ?? []).filter((order) => !invoiced.has(order.id)).map((order) => <form action={issueInvoice} key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><input type="hidden" name="order_id" value={order.id} /><span><strong>{order.order_number}</strong> · {order.customer_name} · {formatPrice(order.total_cents)}</span><Button size="sm">PDF ausstellen</Button></form>)}</div></CardContent></Card>
    {!invoices?.length ? <EmptyAdmin>Noch keine Rechnungen vorhanden.</EmptyAdmin> : <div className="space-y-3">{invoices.map((invoice) => <Card key={invoice.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><p className="font-semibold">{invoice.invoice_number ?? "Entwurf ohne Nummer"}</p><p className="text-muted text-xs">{invoice.kind} · Bestellung {invoice.order_id}</p></div><div className="text-right"><Badge>{invoice.status}</Badge><p className="my-2 font-mono">{formatPrice(invoice.gross_cents)}</p>{invoice.status === "issued" ? <Button asChild size="sm" variant="secondary"><a href={`/api/admin/rechnungen/${invoice.id}`}>PDF herunterladen</a></Button> : null}</div></CardContent></Card>)}</div>}</div>;
}
