import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminHeader, EmptyAdmin, Field, fieldClass, areaClass } from "@/components/admin/admin-ui";
import { formatPrice } from "@/lib/utils";
import { updateOrder } from "../actions";

const ORDER_STATUSES: Array<[string, string]> = [
  ["draft", "Brouillon"],
  ["pending_payment", "En attente de paiement"],
  ["paid", "Payée"],
  ["confirmed", "Confirmée"],
  ["processing", "En préparation"],
  ["shipped", "Expédiée"],
  ["delivered", "Livrée"],
  ["cancelled", "Annulée"],
  ["refunded", "Remboursée"],
];

export default async function OrdersAdminPage() {
  const supabase = await getMigrationAwareServerSupabase();
  const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
  return <div className="space-y-8"><AdminHeader eyebrow="Ventes" title="Commandes" description="Gérer séparément le statut, le paiement, l'expédition et les notes internes." />
    {!orders?.length ? <EmptyAdmin>Aucune commande pour le moment.</EmptyAdmin> : <div className="space-y-3">{orders.map((order) => <Card key={order.id}><CardContent className="pt-6"><details><summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3"><span className="min-w-0"><strong>{order.order_number}</strong><span className="text-muted ml-2 break-all">{order.customer_name}</span></span><span className="font-mono">{formatPrice(order.total_cents)}</span></summary><form action={updateOrder} className="mt-6 grid gap-4 md:grid-cols-2"><input type="hidden" name="id" value={order.id} /><Field label="Statut de la commande"><select name="status" defaultValue={order.status} className={fieldClass}>{ORDER_STATUSES.map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></Field><Field label="Client"><input value={`${order.customer_name} · ${order.customer_email}`} readOnly className={fieldClass} /></Field><Field label="Transporteur" hint="DHL, DPD, GLS, Hermes, UPS ou transporteur"><input name="tracking_carrier" defaultValue={order.tracking_carrier ?? ""} className={fieldClass} /></Field><Field label="Numéro de suivi"><input name="tracking_number" defaultValue={order.tracking_number ?? ""} className={fieldClass} /></Field><div className="md:col-span-2"><Field label="Notes internes"><textarea name="internal_notes" defaultValue={order.internal_notes ?? ""} className={areaClass} /></Field></div><div className="md:col-span-2"><p className="text-muted mb-3 text-xs">À chaque changement de statut, le client est prévenu automatiquement par e-mail (si Resend est configuré) ; la commande est également transmise par Telegram.</p><Button>Mettre à jour la commande</Button></div></form></details></CardContent></Card>)}</div>}
  </div>;
}
