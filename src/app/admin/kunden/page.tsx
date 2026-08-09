import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { AdminHeader, EmptyAdmin } from "@/components/admin/admin-ui";
import { Card, CardContent } from "@/components/ui/card";

export default async function CustomersAdminPage() {
  const supabase = await getMigrationAwareServerSupabase();
  const { data: customers } = await supabase.from("profiles").select("id,email,first_name,last_name,phone,marketing_opt_in,created_at").order("created_at", { ascending: false }).limit(100);
  return <div className="space-y-8"><AdminHeader eyebrow="CRM" title="Kunden" description="Kontaktdaten und Einwilligungsstatus. Keine Zahlungs- oder Passwortdaten werden gespeichert." />{!customers?.length ? <EmptyAdmin>Noch keine Kunden vorhanden.</EmptyAdmin> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{customers.map((customer) => <Card key={customer.id}><CardContent className="space-y-2 pt-6"><p className="font-semibold">{[customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Ohne Namen"}</p><p className="text-muted break-all text-sm">{customer.email}</p>{customer.phone ? <p className="text-muted text-sm">{customer.phone}</p> : null}<p className="text-muted text-xs">Newsletter: {customer.marketing_opt_in ? "Ja" : "Nein"}</p></CardContent></Card>)}</div>}</div>;
}
