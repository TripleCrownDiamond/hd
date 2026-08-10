import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Instagram, Facebook, Linkedin, Youtube } from "lucide-react";
import { FooterNewsletter } from "@/components/layout/footer-newsletter";
import { Logo } from "@/components/layout/logo";
import { TiktokIcon } from "@/components/layout/brand-icons";
import { BRAND_NAME } from "@/lib/brand";
import { getCompany } from "@/lib/company-server";
import { getSiteSettings } from "@/lib/settings-server";

/**
 * Four columns of links, then everything else on centred horizontal rows.
 *
 * Every href here points at its canonical route. `/versand-und-zahlung` and
 * `/widerrufsbelehrung` still redirect for the sake of old inbound links, but
 * the footer should not spend a redirect hop on its own navigation.
 */
const footerSections = [
  {
    title: "Sortiment",
    links: [
      { label: "Brennholz", href: "/brennholz" },
      { label: "Stammholz & Meterholz", href: "/stammholz" },
      { label: "Anzündholz", href: "/anzuendholz" },
      { label: "Holzpellets", href: "/holzpellets" },
      { label: "Holzbriketts", href: "/holzbriketts" },
      { label: "Kohle & Grillkohle", href: "/kohle" },
      { label: "Kaminöfen", href: "/kaminoefen" },
      { label: "Zubehör", href: "/zubehoer" },
    ],
  },
  {
    title: "Service",
    links: [
      { label: "Liefergebiet prüfen", href: "/liefergebiet" },
      { label: "Versand und Lieferung", href: "/versand" },
      { label: "Zahlungsarten", href: "/zahlung" },
      { label: "Montage und Inbetriebnahme", href: "/montage-und-inbetriebnahme" },
      { label: "Bestellung verfolgen", href: "/bestellung/verfolgen" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Unternehmen",
    links: [
      { label: "Über uns", href: "/ueber-uns" },
      { label: "Kontakt", href: "/kontakt" },
      { label: "Ratgeber", href: "/ratgeber" },
    ],
  },
  {
    title: "Rechtliches",
    links: [
      { label: "Impressum", href: "/impressum" },
      { label: "Datenschutz", href: "/datenschutz" },
      { label: "AGB", href: "/agb" },
      { label: "Widerrufsbelehrung", href: "/widerruf" },
      { label: "Widerrufsformular", href: "/widerrufsformular" },
      { label: "Barrierefreiheit", href: "/barrierefreiheit" },
      { label: "Cookie-Einstellungen", href: "/cookie-einstellungen" },
    ],
  },
];

export async function Footer() {
  const settings = await getSiteSettings();
  // Same resolution the legal pages use — an admin edit wins, otherwise the
  // details the company has confirmed in code.
  const company = await getCompany();

  // One line, not a stacked block: the address used to sit in its own column
  // under the link grid, which read as a stray fifth column.
  const addressLine = [
    company.name,
    company.street,
    [company.postalCode, company.city].filter(Boolean).join(" ") || null,
  ]
    .filter(Boolean)
    .join(", ");

  const contactItems = [
    addressLine ? { key: "address", Icon: MapPin, label: addressLine, href: null } : null,
    company.phone
      ? {
          key: "phone",
          Icon: Phone,
          label: company.phone,
          // tel: cannot carry spaces — strip them, keep the readable label.
          href: `tel:${company.phone.replace(/\s+/g, "")}`,
        }
      : null,
    settings?.phone_secondary
      ? {
          key: "phone2",
          Icon: Phone,
          label: settings.phone_secondary,
          href: `tel:${settings.phone_secondary.replace(/\s+/g, "")}`,
        }
      : null,
    company.email
      ? { key: "email", Icon: Mail, label: company.email, href: `mailto:${company.email}` }
      : null,
    company.supportEmail
      ? {
          key: "support",
          Icon: Mail,
          label: company.supportEmail,
          href: `mailto:${company.supportEmail}`,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  const legalDetails = [
    company.vatId ? `USt-IdNr.: ${company.vatId}` : null,
    company.taxNumber ? `Steuernummer: ${company.taxNumber}` : null,
    company.commercialRegister ? `Handelsregister: ${company.commercialRegister}` : null,
    company.registerCourt ? `Registergericht: ${company.registerCourt}` : null,
    company.managingDirector ? `Geschäftsführung: ${company.managingDirector}` : null,
  ].filter((detail): detail is string => Boolean(detail));

  const socials = [
    [company.social.facebook, "Facebook", Facebook],
    [company.social.tiktok, "TikTok", TiktokIcon],
    [company.social.instagram, "Instagram", Instagram],
    [company.social.linkedin, "LinkedIn", Linkedin],
    [company.social.youtube, "YouTube", Youtube],
  ] as const;
  const activeSocials = socials.filter(([url]) => Boolean(url));

  return (
    <footer className="border-border bg-brand border-t text-white" role="contentinfo">
      <div className="container-site py-14">
        <div className="flex justify-center">
          {settings?.logo_url ? (
            <Image
              src={settings.logo_url}
              alt={settings.company_name || BRAND_NAME}
              width={976}
              height={129}
              unoptimized
              className="mb-10 h-8 w-auto brightness-0 invert"
            />
          ) : (
            <Logo tone="mono" className="mb-10 h-7 w-auto text-white sm:h-8" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-display mb-4 text-sm font-semibold tracking-wider text-white/80 uppercase">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
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

        {/* Contact: one centred, wrapping row rather than a fifth column. */}
        {contactItems.length > 0 && (
          <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 border-t border-white/10 pt-8 text-sm text-white/70">
            {contactItems.map((item) => (
              <li key={item.key} className="flex items-center gap-2">
                <item.Icon className="size-4 shrink-0" aria-hidden="true" />
                {item.href ? (
                  <a href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </a>
                ) : (
                  <span>{item.label}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {activeSocials.length > 0 && (
          <div className="mt-6 flex justify-center gap-2">
            {activeSocials.map(([url, label, Icon]) => (
              <a
                key={label}
                href={url as string}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="rounded-md border border-white/20 p-2 transition-colors hover:bg-white/10"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        )}

        {settings?.newsletter_enabled && (
          <div className="mx-auto mt-10 max-w-md border-t border-white/10 pt-8 text-center">
            <h3 className="font-display mb-2 text-sm font-semibold tracking-wider text-white/80 uppercase">
              Newsletter
            </h3>
            <p className="mb-4 text-sm text-white/70">
              Tipps rund um Holz, Wärme und Kaminöfen.
            </p>
            <FooterNewsletter />
          </div>
        )}
      </div>

      <div className="border-t border-white/10">
        {/* Extra bottom padding on small screens: the floating WhatsApp button
            sits in this corner and was covering the last line. */}
        <div className="container-site flex flex-col items-center gap-2 pt-6 pb-24 text-center text-xs text-white/50 sm:pb-6">
          {legalDetails.length > 0 && (
            <p className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              {legalDetails.map((detail) => (
                <span key={detail}>{detail}</span>
              ))}
            </p>
          )}
          <p>
            &copy; {new Date().getFullYear()} {company.name}. Alle Preise inkl. gesetzlicher MwSt.
            zzgl. Versandkosten.
          </p>
        </div>
      </div>
    </footer>
  );
}
