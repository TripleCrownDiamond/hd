import Link from "next/link";
import { AlertTriangle, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getCompany } from "@/lib/company-server";
import { missingMandatoryFields } from "@/lib/company";
import { getPaymentOptions } from "@/lib/payments/server";
import { getMigrationAwarePublicSupabase } from "@/lib/db/server";
import { LEGAL_DEFAULTS } from "@/lib/legal/defaults";

interface Blocker {
  ok: boolean;
  label: string;
  detail: string;
  href: string;
}

/**
 * The things that stop a customer from completing an order, in one place.
 *
 * Each of these fails silently somewhere else: an empty `payment_settings`
 * disables the order button with a one-line notice at the bottom of the
 * checkout, and a missing Impressum only shows on the Impressum. An operator
 * who never visits those pages has no way to know the shop cannot sell.
 */
export async function GoLiveChecklist() {
  const [company, paymentOptions, contentResult] = await Promise.all([
    getCompany(),
    getPaymentOptions().catch(() => []),
    getMigrationAwarePublicSupabase()
      .from("content_entries")
      .select("slug,status")
      .in(
        "slug",
        LEGAL_DEFAULTS.map((entry) => entry.slug),
      ),
  ]);

  const published = new Set(
    (contentResult.data ?? [])
      .filter((row) => row.status === "published")
      .map((row) => String(row.slug).toLowerCase()),
  );
  const unpublishedLegal = LEGAL_DEFAULTS.filter((entry) => !published.has(entry.slug));
  const missingCompany = missingMandatoryFields(company);

  const blockers: Blocker[] = [
    {
      ok: paymentOptions.length > 0,
      label: "Zahlungsart freigeschaltet",
      detail:
        paymentOptions.length > 0
          ? `${paymentOptions.length} Zahlungsart(en) aktiv.`
          : "Ohne freigeschaltete Zahlungsart bleibt „Zahlungspflichtig bestellen“ deaktiviert — es kann niemand bestellen.",
      href: "/admin/zahlungen",
    },
    {
      ok: missingCompany.length === 0,
      label: "Pflichtangaben nach § 5 DDG",
      detail:
        missingCompany.length === 0
          ? "Impressum vollständig."
          : `Es fehlen: ${missingCompany.join(", ")}.`,
      href: "/admin/einstellungen",
    },
    {
      ok: unpublishedLegal.length === 0,
      label: "Rechtstexte im CMS veröffentlicht",
      detail:
        unpublishedLegal.length === 0
          ? "Alle Rechtstexte werden aus dem CMS ausgeliefert."
          : `${unpublishedLegal.length} Seiten laufen noch auf der Code-Vorlage: ${unpublishedLegal
              .map((entry) => entry.slug)
              .join(", ")}.`,
      href: "/admin/inhalte",
    },
  ];

  const open = blockers.filter((blocker) => !blocker.ok);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bereit für den Verkauf</CardTitle>
        <CardDescription>
          {open.length === 0
            ? "Alle Voraussetzungen erfüllt."
            : `${open.length} offene Punkte. Solange der erste offen ist, kann keine Bestellung abgeschlossen werden.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-border divide-y">
          {blockers.map((blocker) => (
            <li key={blocker.label} className="flex items-start gap-3 py-3">
              {blocker.ok ? (
                <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <p className="text-text text-sm font-medium">
                  {blocker.label}
                  <span className="sr-only">{blocker.ok ? " — erledigt" : " — offen"}</span>
                </p>
                <p className="text-muted mt-0.5 text-sm">{blocker.detail}</p>
                {!blocker.ok && (
                  <Link href={blocker.href} className="text-accent mt-1 inline-block text-sm underline">
                    Jetzt einrichten
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
