import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Instagram, Facebook, Linkedin, Youtube } from "lucide-react";
import { FooterNewsletter } from "@/components/layout/footer-newsletter";
import { Logo } from "@/components/layout/logo";
import { BRAND_NAME } from "@/lib/brand";
import { getMigrationAwarePublicSupabase } from "@/lib/db/server";
import type { SiteSettingsRow } from "@/lib/db/types";

const footerSections = [
  {
    title: "Sortiment",
    links: [
      { label: "Brennholz", href: "/brennholz" },
      { label: "Stammholz & Meterholz", href: "/stammholz" },
      { label: "Kaminöfen", href: "/kaminoefen" },
      { label: "Holzpellets", href: "/holzpellets" },
      { label: "Holzbriketts", href: "/holzbriketts" },
      { label: "Kohle & Grillkohle", href: "/kohle" },
      { label: "Zubehör", href: "/zubehoer" },
    ],
  },
  {
    title: "Service",
    links: [
      { label: "Liefergebiet prüfen", href: "/liefergebiet" },
      { label: "Versand und Zahlung", href: "/versand-und-zahlung" },
      { label: "Montage und Inbetriebnahme", href: "/montage-und-inbetriebnahme" },
      { label: "Bestellung verfolgen", href: "/bestellung/verfolgen" },
      { label: "FAQ", href: "/faq" },
      { label: "Kontakt", href: "/kontakt" },
    ],
  },
  {
    title: "Unternehmen",
    links: [
      { label: "Über uns", href: "/ueber-uns" },
      { label: "Ratgeber", href: "/ratgeber" },
    ],
  },
  {
    title: "Rechtliches",
    links: [
      { label: "Impressum", href: "/impressum" },
      { label: "Datenschutz", href: "/datenschutz" },
      { label: "AGB", href: "/agb" },
      { label: "Widerrufsbelehrung", href: "/widerrufsbelehrung" },
      { label: "Widerrufsformular", href: "/widerrufsformular" },
      { label: "Barrierefreiheit", href: "/barrierefreiheit" },
      { label: "Cookie-Einstellungen", href: "/cookie-einstellungen" },
    ],
  },
];

export async function Footer() {
  const { data } = await getMigrationAwarePublicSupabase().from("site_settings").select("*").eq("id", 1).maybeSingle();
  const settings = data as SiteSettingsRow | null;
  const hasAddress = Boolean(settings?.street || settings?.postal_code || settings?.city);
  const hasContact = Boolean(hasAddress || settings?.phone || settings?.phone_secondary || settings?.email || settings?.support_email);
  const legalDetails = [
    settings?.vat_id ? `USt-IdNr.: ${settings.vat_id}` : null,
    settings?.tax_number ? `Steuernummer: ${settings.tax_number}` : null,
    settings?.commercial_register ? `Handelsregister: ${settings.commercial_register}` : null,
    settings?.register_court ? `Registergericht: ${settings.register_court}` : null,
    settings?.managing_director ? `Geschäftsführung: ${settings.managing_director}` : null,
  ].filter((detail): detail is string => Boolean(detail));
  const socials = [
    [settings?.social_instagram, "Instagram", Instagram], [settings?.social_facebook, "Facebook", Facebook],
    [settings?.social_linkedin, "LinkedIn", Linkedin], [settings?.social_youtube, "YouTube", Youtube],
  ] as const;
  return (
    <footer className="border-t border-border bg-brand text-white" role="contentinfo">
      <div className="container-site py-16">
        {/* An uploaded logo wins; otherwise the drawn wordmark, knocked out on green. */}
        {settings?.logo_url ? (
          <Image src={settings.logo_url} alt={settings.company_name || BRAND_NAME} width={976} height={129} unoptimized className="mb-10 h-9 w-auto brightness-0 invert" />
        ) : (
          <Logo tone="mono" className="mb-10 h-9 w-auto text-white" />
        )}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-white/80">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact & Payment */}
        {(hasContact || settings?.newsletter_enabled || socials.some(([url]) => Boolean(url))) ? <div className="mt-12 grid grid-cols-1 gap-8 border-t border-white/10 pt-8 lg:grid-cols-2">
          {/* Contact */}
          {hasContact ? <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-white/80">
              Kontakt
            </h3>
            <ul className="space-y-3 text-sm text-white/70">
              {hasAddress ? <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  {[settings?.company_name, settings?.legal_form].filter(Boolean).join(" ")}<br />
                  {settings?.street}<br />
                  {[settings?.postal_code, settings?.city].filter(Boolean).join(" ")}
                </span>
              </li> : null}
              {settings?.phone ? <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" />
                <a href={`tel:${settings.phone}`} className="hover:text-white">{settings.phone}</a>
              </li> : null}
              {settings?.phone_secondary ? <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" />
                <a href={`tel:${settings.phone_secondary}`} className="hover:text-white">{settings.phone_secondary}</a>
              </li> : null}
              {settings?.email ? <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-white">{settings.email}</a>
              </li> : null}
              {settings?.support_email ? <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" />
                <a href={`mailto:${settings.support_email}`} className="hover:text-white">{settings.support_email}</a>
              </li> : null}
            </ul>
            <div className="mt-4 flex gap-2">{socials.map(([url,label,Icon]) => url ? <a key={label} href={url} target="_blank" rel="noreferrer noopener" aria-label={label} className="rounded-md border border-white/20 p-2 hover:bg-white/10"><Icon className="size-4" /></a> : null)}</div>
          </div> : null}

          {/* Newsletter */}
          {settings?.newsletter_enabled ? <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-white/80">
              Newsletter
            </h3>
            <p className="mb-4 text-sm text-white/70">
              Tipps rund um Holz, Wärme und Kaminöfen.
            </p>
            <FooterNewsletter />
          </div> : null}
        </div> : null}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-4 py-6 text-xs text-white/50 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {settings?.company_name || BRAND_NAME}. Alle Preise inkl.
            gesetzlicher MwSt. zzgl. Versandkosten.
          </p>
          {legalDetails.length > 0 ? <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 sm:justify-start">
            {legalDetails.map((detail) => <span key={detail}>{detail}</span>)}
          </div> : null}
          <div className="flex gap-4">
            <Link href="/impressum" className="hover:text-white/80">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-white/80">
              Datenschutz
            </Link>
            <Link href="/agb" className="hover:text-white/80">
              AGB
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
