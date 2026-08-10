import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { AdminHeader, EmptyAdmin } from "@/components/admin/admin-ui";
import { Card, CardContent } from "@/components/ui/card";

export default async function CustomersAdminPage() {
  const supabase = await getMigrationAwareServerSupabase();
  const { data: customers } = await supabase.from("profiles").select("id,email,first_name,last_name,phone,marketing_opt_in,created_at").order("created_at", { ascending: false }).limit(100);
  return <div className="space-y-8"><AdminHeader eyebrow="CRM" title="Clients" description="Coordonnées et statut de consentement. Aucune donnée de paiement ou de mot de passe n'est stockée." />{!customers?.length ? <EmptyAdmin>Aucun client pour le moment.</EmptyAdmin> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{customers.map((customer) => <Card key={customer.id}><CardContent className="space-y-2 pt-6"><p className="font-semibold">{[customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Sans nom"}</p><p className="text-muted break-all text-sm">{customer.email}</p>{customer.phone ? <p className="text-muted text-sm">{customer.phone}</p> : null}<p className="text-muted text-xs">Newsletter : {customer.marketing_opt_in ? "Oui" : "Non"}</p></CardContent></Card>)}</div>}</div>;
}
