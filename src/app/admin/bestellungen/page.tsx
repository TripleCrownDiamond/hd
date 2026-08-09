import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminHeader, EmptyAdmin, Field, fieldClass, areaClass } from "@/components/admin/admin-ui";
import { formatPrice } from "@/lib/utils";
import { updateOrder } from "../actions";

export default async function OrdersAdminPage() {
  const supabase = await getMigrationAwareServerSupabase();
  const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
  return <div className="space-y-8"><AdminHeader eyebrow="Verkauf" title="Bestellungen" description="Status, Zahlung, Erfüllung und interne Notizen getrennt verwalten." />
    {!orders?.length ? <EmptyAdmin>Noch keine Bestellungen vorhanden.</EmptyAdmin> : <div className="space-y-3">{orders.map((order) => <Card key={order.id}><CardContent className="pt-6"><details><summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3"><span><strong>{order.order_number}</strong><span className="text-muted ml-2">{order.customer_name}</span></span><span className="font-mono">{formatPrice(order.total_cents)}</span></summary><form action={updateOrder} className="mt-6 grid gap-4 md:grid-cols-2"><input type="hidden" name="id" value={order.id} /><Field label="Bestellstatus"><select name="status" defaultValue={order.status} className={fieldClass}>{["draft","pending_payment","paid","confirmed","processing","shipped","delivered","cancelled","refunded"].map((status) => <option key={status}>{status}</option>)}</select></Field><Field label="Kunde"><input value={`${order.customer_name} · ${order.customer_email}`} readOnly className={fieldClass} /></Field><Field label="Versanddienstleister" hint="DHL, DPD, GLS, Hermes, UPS oder Spedition"><input name="tracking_carrier" defaultValue={order.tracking_carrier ?? ""} className={fieldClass} /></Field><Field label="Sendungsnummer"><input name="tracking_number" defaultValue={order.tracking_number ?? ""} className={fieldClass} /></Field><div className="md:col-span-2"><Field label="Interne Notizen"><textarea name="internal_notes" defaultValue={order.internal_notes ?? ""} className={areaClass} /></Field></div><div className="md:col-span-2"><p className="text-muted mb-3 text-xs">Bei Statuswechsel wird der Kunde automatisch per E-Mail benachrichtigt (sofern Resend konfiguriert ist); die Bestellung geht zusätzlich per Telegram ein.</p><Button>Bestellung aktualisieren</Button></div></form></details></CardContent></Card>)}</div>}
  </div>;
}
