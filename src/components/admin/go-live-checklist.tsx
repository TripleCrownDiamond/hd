import Link from "next/link";
import { AlertTriangle, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getCompany } from "@/lib/company-server";
import { missingMandatoryFields } from "@/lib/company";
import { getPaymentOptions } from "@/lib/payments/server";
import { getMigrationAwarePublicSupabase } from "@/lib/db/server";
import { LEGAL_DEFAULTS } from "@/lib/legal/defaults";
import { adminInbox, emailTransport, verifyEmailTransport } from "@/lib/notifications/email";
import { Button } from "@/components/ui/button";
import { sendTestEmail } from "@/app/admin/actions";

interface Blocker {
  ok: boolean;
  label: string;
  detail: string;
  href: string;
}

/**
 * Published legal-page slugs. Advisory only: a transient Supabase failure
 * degrades to an empty list instead of taking the admin dashboard down.
 */
async function readPublishedContentSlugs(): Promise<string[]> {
  try {
    const { data } = await getMigrationAwarePublicSupabase()
      .from("content_entries")
      .select("slug,status")
      .in(
        "slug",
        LEGAL_DEFAULTS.map((entry) => entry.slug),
      );
    return (data ?? [])
      .filter((row) => row.status === "published")
      .map((row) => String(row.slug).toLowerCase());
  } catch {
    return [];
  }
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
  const [company, paymentOptions, published, mail] = await Promise.all([
    getCompany(),
    getPaymentOptions().catch(() => []),
    // The whole checklist is advisory: a transient Supabase failure must not
    // take the admin dashboard down with it, so every read here degrades.
    readPublishedContentSlugs(),
    // Actually opens the connection and authenticates — a wrong password shows
    // up here rather than in a customer's missing confirmation.
    verifyEmailTransport().catch(() => ({ ok: false, detail: "Vérification échouée." })),
  ]);

  const publishedSet = new Set(published);
  const unpublishedLegal = LEGAL_DEFAULTS.filter((entry) => !publishedSet.has(entry.slug));
  const missingCompany = missingMandatoryFields(company);

  const blockers: Blocker[] = [
    {
      ok: paymentOptions.length > 0,
      label: "Moyen de paiement activé",
      detail:
        paymentOptions.length > 0
          ? `${paymentOptions.length} moyen(s) de paiement actif(s).`
          : "Sans moyen de paiement activé, « Commander en payant » reste désactivé — personne ne peut commander.",
      href: "/admin/zahlungen",
    },
    {
      ok: missingCompany.length === 0,
      label: "Mentions obligatoires (§ 5 DDG)",
      detail:
        missingCompany.length === 0
          ? "Impressum complet."
          : `Manquent : ${missingCompany.join(", ")}.`,
      href: "/admin/einstellungen",
    },
    {
      ok: mail.ok,
      label: "Envoi d'e-mails",
      detail: emailTransport()
        ? `${emailTransport() === "smtp" ? "SMTP" : "Resend"} · Boîte admin ${
            adminInbox() ?? "non définie"
          } · ${mail.detail}`
        : "Ni SMTP ni Resend configuré — les confirmations de commande et les notifications de statut ne seront pas envoyées.",
      href: "/admin/einstellungen",
    },
    {
      ok: unpublishedLegal.length === 0,
      label: "Textes juridiques publiés dans le CMS",
      detail:
        unpublishedLegal.length === 0
          ? "Tous les textes juridiques sont servis depuis le CMS."
          : `${unpublishedLegal.length} pages utilisent encore le modèle du code : ${unpublishedLegal
              .map((entry) => entry.slug)
              .join(", ")}.`,
      href: "/admin/inhalte",
    },
  ];

  const open = blockers.filter((blocker) => !blocker.ok);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prêt à vendre</CardTitle>
        <CardDescription>
          {open.length === 0
            ? "Toutes les conditions sont réunies."
            : `${open.length} point(s) en suspens. Tant que le premier n'est pas réglé, aucune commande ne peut être finalisée.`}
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
                  <span className="sr-only">{blocker.ok ? " — réglé" : " — en suspens"}</span>
                </p>
                <p className="text-muted mt-0.5 text-sm">{blocker.detail}</p>
                {!blocker.ok && (
                  <Link href={blocker.href} className="text-accent mt-1 inline-block text-sm underline">
                    Configurer maintenant
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
        {emailTransport() ? (
          <form action={sendTestEmail} className="border-border mt-4 border-t pt-4">
            <Button type="submit" variant="secondary" size="sm">
              Envoyer un e-mail de test à {adminInbox()}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
