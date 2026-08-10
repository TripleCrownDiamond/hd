import type { Metadata } from "next";
import { Newsreader, Manrope, IBM_Plex_Mono } from "next/font/google";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartProvider } from "@/lib/cart/cart-store";
import { ShortlistProvider } from "@/lib/shortlists/shortlist-store";
import { DeliveryProvider } from "@/lib/shipping/delivery-store";
import { CartSheet } from "@/components/commerce/cart-sheet";
import { getMegaMenu } from "@/lib/products/navigation";
import "./globals.css";
import { getSiteSettings } from "@/lib/settings-server";
import { FloatingChat } from "@/components/chat/floating-chat";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    template: `%s – ${BRAND_NAME}`,
    default: `${BRAND_NAME} – ${BRAND_TAGLINE}`,
  },
  description:
    "Hochwertiges Brennholz, Holzpellets, Holzbriketts und geprüfte Kaminöfen mit transparenter Lieferung in Ihrer Region.",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sections = await getMegaMenu();
  const shopSettings = await getSiteSettings();

  return (
    <html
      lang="de-DE"
      className={`${newsreader.variable} ${manrope.variable} ${ibmPlexMono.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          <DeliveryProvider>
          <ShortlistProvider>
          <a href="#main-content" className="skip-link">
            Zum Hauptinhalt springen
          </a>
          <Header sections={sections} />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <CartSheet />
          {shopSettings?.chatbot_enabled ? <FloatingChat name={shopSettings.chatbot_name ?? undefined} /> : null}
          {/* Stacks above the chat launcher when both share the corner. */}
          <FloatingWhatsApp stacked={Boolean(shopSettings?.chatbot_enabled)} />
          </ShortlistProvider>
          </DeliveryProvider>
        </CartProvider>
      </body>
    </html>
  );
}
