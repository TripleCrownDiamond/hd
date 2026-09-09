import Link from "next/link";
import { Heart, PackageSearch, ArrowRight, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { STATUS_LABEL, type OrderStatus } from "@/lib/orders/status";
import { formatPrice } from "@/lib/utils";

const tiles = [
  {
    label: "Merkliste",
    href: "/konto/favoriten",
    icon: Heart,
    desc: "Gemerkte Produkte für später",
  },
  {
    label: "Sendung verfolgen",
    href: "/bestellung/verfolgen",
    icon: PackageSearch,
    desc: "Status einer Bestellung anhand der Bestellnummer abrufen",
  },
];

/** Statuses that mean the order is still moving, and worth highlighting. */
const OPEN_STATUSES = new Set<OrderStatus>([
  "pending_payment",
  "paid",
  "confirmed",
  "processing",
  "shipped",
]);

/**
 * Greeting plus the customer's own orders.
 *
 * The dashboard used to be two static tiles — nothing here belonged to the
 * person signed in, so the page carried no reason to visit it. RLS ("orders:
 * customer own") scopes the query to the session, so this can only ever return
 * the viewer's own rows. A transient failure degrades to the tiles alone rather
 * than an error page.
 */
async function readAccount(): Promise<{
  firstName: string | null;
  orders: {
    id: string;
    order_number: string;
    status: OrderStatus;
    total_cents: number;
    created_at: string;
  }[];
}> {
  try {
    const supabase = await getMigrationAwareServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { firstName: null, orders: [] };

    const [profile, orders] = await Promise.all([
      supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle(),
      supabase
        .from("orders")
        .select("id,order_number,status,total_cents,created_at")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return {
      firstName: (profile.data?.first_name as string | null) ?? null,
      orders: (orders.data ?? []) as Awaited<ReturnType<typeof readAccount>>["orders"],
    };
  } catch {
    return { firstName: null, orders: [] };
  }
}

export default async function AccountPage() {
  const { firstName, orders } = await readAccount();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted text-sm">Willkommen zurück</p>
        <h1 className="font-display text-text mt-1 text-3xl font-semibold">
          {firstName ? `Hallo, ${firstName}` : "Ihr Kundenkonto"}
        </h1>
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-text text-xl font-semibold">Ihre Bestellungen</h2>
          {orders.length > 0 ? (
            <Link
              href="/bestellung/verfolgen"
              className="text-accent text-sm hover:underline"
            >
              Sendung verfolgen
            </Link>
          ) : null}
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-3 py-8">
              <div className="bg-brand/5 flex size-11 items-center justify-center rounded-lg">
                <Receipt className="text-brand size-5" aria-hidden="true" />
              </div>
              <p className="text-muted text-sm">
                Hier erscheinen Ihre Bestellungen, sobald Sie die erste aufgegeben haben.
              </p>
              <Link
                href="/brennholz"
                className="text-accent inline-flex items-center gap-1 text-sm hover:underline"
              >
                Brennholz entdecken
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-border divide-y">
                {orders.map((order) => (
                  <li
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-text font-mono text-sm font-semibold">
                        {order.order_number}
                      </p>
                      <p className="text-muted mt-0.5 text-xs">
                        {new Date(order.created_at).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={OPEN_STATUSES.has(order.status) ? "default" : "success"}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </Badge>
                      <span className="text-text font-mono text-sm tabular-nums">
                        {formatPrice(order.total_cents)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <h2 className="font-display text-text mb-4 text-xl font-semibold">Schnellzugriff</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {tiles.map((tile) => (
            <Link
              key={tile.label}
              href={tile.href}
              className="group focus-visible:outline-accent focus-visible:rounded-xl focus-visible:outline-3 focus-visible:outline-offset-2"
            >
              <Card className="duration-base ease-spring group-hover:border-brand/30 h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="bg-brand/5 mb-4 flex size-11 items-center justify-center rounded-lg">
                    <tile.icon className="text-brand size-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-text text-base font-semibold">{tile.label}</h3>
                  <p className="text-muted mt-1 text-sm">{tile.desc}</p>
                  <span className="text-accent mt-4 inline-flex items-center gap-1 text-sm transition-transform group-hover:translate-x-0.5">
                    Öffnen
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
