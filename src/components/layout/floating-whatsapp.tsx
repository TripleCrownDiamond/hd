import { WhatsappIcon } from "@/components/layout/brand-icons";
import { getCompany } from "@/lib/company-server";
import { whatsappHref } from "@/lib/company";
import { cn } from "@/lib/utils";

/**
 * Floating WhatsApp button.
 *
 * A plain link, so it needs no client JavaScript and works before hydration —
 * which matters for the one control a customer reaches for when something on
 * the page has gone wrong.
 *
 * It shares the bottom-right corner with the AI chat launcher. When the chat is
 * enabled this sits above it rather than underneath; `stacked` is passed by the
 * layout, which is the only place that knows whether the chat renders.
 */
export async function FloatingWhatsApp({ stacked = false }: { stacked?: boolean }) {
  const company = await getCompany();
  const href = whatsappHref(
    company,
    "Guten Tag, ich habe eine Frage zu Ihrem Angebot.",
  );
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "fixed right-5 z-fixed flex size-14 items-center justify-center rounded-full text-white shadow-xl transition-transform hover:scale-105 focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 print:hidden",
        // WhatsApp's own green: recolouring it to the brand palette makes the
        // button unrecognisable, which is the whole reason it works.
        "bg-[#25D366] hover:bg-[#1ebe5b]",
        stacked ? "bottom-24" : "bottom-5",
      )}
      aria-label={`Per WhatsApp schreiben: ${company.phone}`}
    >
      <WhatsappIcon className="size-7" />
    </a>
  );
}
