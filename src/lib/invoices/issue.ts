import "server-only";
import { createHash } from "node:crypto";
import { getMigrationAwareServiceSupabase } from "@/lib/db/server";
import { sendEmail } from "@/lib/notifications/email";
import { generateInvoicePdf } from "./pdf";

/** A line the admin adds to an invoice that was not part of the original order. */
export interface InvoiceExtraItem {
  /** Product name as it appears on the invoice. */
  name: string;
  quantity: number;
  /** Gross (VAT-inclusive) unit price in EUR cents, like every price on the site. */
  unitPriceCents: number;
  /** VAT rate in percent (19 by default). Used only to split tax. */
  taxRatePct?: number;
  /** When set, the product is also created in the catalogue before invoicing. */
  createProduct?: boolean;
}

/**
 * Raise the invoice for an order, optionally adding extra lines.
 *
 * The invoice snapshot is immutable once issued: the extra lines are frozen
 * into it and into the PDF. When `createProduct` is set on a line, the product
 * is inserted into the catalogue (published, approved) with the same gross
 * price, so a manually sold item can later be ordered online too.
 */
export async function issueInvoiceForOrder(
  orderId: string,
  extraItems: InvoiceExtraItem[] = [],
) {
  const supabase = getMigrationAwareServiceSupabase();
  const [{ data: order }, { data: items }, { data: settings }, { data: existing }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", orderId).single(),
    supabase.from("order_items").select("*").eq("order_id", orderId).order("created_at"),
    supabase.from("site_settings").select("*").eq("id", 1).single(),
    supabase.from("invoices").select("id,invoice_number,status,document_path").eq("order_id", orderId).eq("kind", "invoice").neq("status", "void").maybeSingle(),
  ]);
  if (existing) throw new Error("Für diese Bestellung existiert bereits eine Rechnung.");
  if (!order || !items || !settings) throw new Error("Rechnungsdaten fehlen.");
  if (!settings.company_name || !settings.street || !settings.postal_code || !settings.city) throw new Error("Die Firmenanschrift muss vor Ausstellung gepflegt sein.");
  if (!settings.vat_id && !settings.tax_number) throw new Error("USt-IdNr. oder Steuernummer fehlen — bitte in den Einstellungen pflegen, bevor eine Rechnung ausgestellt wird.");

  // Products the admin chose to publish too. They are created before the
  // invoice: an invoice without its promised catalogue product is worse than
  // a stray product, and the audit log records the action either way.
  const extraProducts: Array<{ name: string; slug: string; priceCents: number; quantity: number }> = [];
  const taxRate = extraItems[0]?.taxRatePct ?? 19;
  for (const [index, extra] of extraItems.entries()) {
    if (extra.createProduct) {
      const slug = makeSlug(extra.name, index);
      const { data: created, error } = await supabase
        .from("products")
        .insert({
          slug,
          kind: "accessory",
          model: extra.name,
          subtitle: null,
          short_description: null,
          long_description: null,
          description_authorized: false,
          price_cents_public: extra.unitPriceCents,
          quote_mode: false,
          extra: {},
          is_published: true,
          review_status: "approved",
        })
        .select("id,slug")
        .single();
      if (error || !created) throw new Error(`Produkt „${extra.name.slice(0, 40)}" konnte nicht angelegt werden.`);
      extraProducts.push({ name: extra.name, slug: created.slug as string, priceCents: extra.unitPriceCents, quantity: extra.quantity });
    }
  }

  const issuedAt = new Date();
  const due = new Date(issuedAt);
  due.setDate(due.getDate() + Number(settings.invoice_payment_terms_days ?? 14));
  const address = order.billing_address as Record<string, string>;

  // Base lines from the order plus the extra lines. Extra-line totals are
  // recomputed here; the order's own lines are used as stored.
  const baseItems = items.map((item) => ({
    name: item.name_snapshot,
    variant: item.variant_snapshot,
    quantity: item.quantity,
    unitPriceCents: item.unit_price_cents,
    discountCents: item.discount_cents ?? 0,
    lineTotalCents: item.line_total_cents,
    taxRate: item.tax_rate,
  }));
  const extraLines = extraItems.map((extra) => {
    const lineTotal = Math.round(extra.quantity * extra.unitPriceCents);
    return {
      name: extra.name,
      variant: null,
      quantity: extra.quantity,
      unitPriceCents: extra.unitPriceCents,
      discountCents: 0,
      lineTotalCents: lineTotal,
      taxRate: extra.taxRatePct ?? 19,
    };
  });
  const snapshotItems = [...baseItems, ...extraLines];
  const extraSubtotal = extraLines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const extraTax = extraLines.reduce(
    (sum, line) => sum + Math.round(line.lineTotalCents * (line.taxRate / (100 + line.taxRate))),
    0,
  );
  const extraNet = extraSubtotal - extraTax;

  const subtotalCents = order.subtotal_cents + extraSubtotal;
  const discountCents = order.discount_cents ?? 0;
  const taxCents = order.tax_cents + extraTax;
  const totalCents = order.total_cents + extraSubtotal;
  const netCents = totalCents - taxCents;

  const baseSnapshot = {
    issuedAt: issuedAt.toISOString(),
    issueDate: issuedAt.toLocaleDateString("de-DE"),
    dueDate: due.toLocaleDateString("de-DE"),
    orderNumber: order.order_number,
    company: {
      name: settings.company_name,
      legalForm: settings.legal_form,
      street: settings.street,
      postalCode: settings.postal_code,
      city: settings.city,
      countryCode: settings.country_code,
      vatId: settings.vat_id,
      taxNumber: settings.tax_number,
      commercialRegister: settings.commercial_register,
      registerCourt: settings.register_court,
      managingDirector: settings.managing_director,
      footer: settings.invoice_footer,
      logoUrl: settings.logo_url,
    },
    customer: {
      name: order.customer_name,
      email: order.customer_email,
      street: address.street,
      houseNumber: address.house_number,
      postcode: address.postcode,
      city: address.city,
    },
    items: snapshotItems,
    amounts: {
      subtotalCents,
      discountCents,
      shippingCents: order.shipping_cents,
      taxCents,
      totalCents,
    },
    promotionCode: order.promotion_code,
    taxRate,
  };

  const { data: draft, error } = await supabase.rpc("create_invoice_draft", {
    p_order_id: orderId,
    p_kind: "invoice",
    p_snapshot: baseSnapshot,
    p_net_cents: netCents,
    p_tax_cents: taxCents,
    p_gross_cents: totalCents,
    p_due_date: due.toISOString().slice(0, 10),
  });
  if (error || !draft) throw new Error("Rechnungsnummer konnte nicht vergeben werden.");
  const invoice = Array.isArray(draft) ? draft[0] : draft;

  const snapshot = { ...baseSnapshot, invoiceNumber: invoice.invoice_number };
  const bytes = Buffer.from(await generateInvoicePdf(snapshot));
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const path = `${issuedAt.getFullYear()}/${invoice.invoice_number}.pdf`;
  const { error: uploadError } = await supabase.storage.from("invoices").upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (uploadError) throw new Error("Rechnungs-PDF konnte nicht gespeichert werden.");
  const { error: issueError } = await supabase.from("invoices").update({ status: "issued", snapshot, document_path: path, document_sha256: sha256, issued_at: issuedAt.toISOString() }).eq("id", invoice.id).eq("status", "draft");
  if (issueError) throw new Error("Rechnung konnte nicht ausgestellt werden.");

  // Send the issued PDF to the customer. Best-effort by design: the invoice is
  // already issued and immutable, a delivery failure must not undo that — it is
  // logged and the PDF stays downloadable from the admin.
  const customerEmail = order.customer_email;
  if (customerEmail) {
    const email = await sendEmail({
      to: customerEmail,
      subject: `Ihre Rechnung ${invoice.invoice_number}`,
      text: `Guten Tag,\n\nanbei erhalten Sie die Rechnung ${invoice.invoice_number} zu Ihrer Bestellung ${order.order_number}.\n\nMit freundlichen Grüßen\n${settings.company_name}`,
      html: `<p>Guten Tag,</p><p>anbei erhalten Sie die Rechnung <strong>${invoice.invoice_number}</strong> zu Ihrer Bestellung ${order.order_number}.</p><p>Mit freundlichen Grüßen<br/>${settings.company_name}</p>`,
      attachments: [
        {
          filename: `${invoice.invoice_number}.pdf`,
          content: bytes,
          contentType: "application/pdf",
        },
      ],
    });
    if (!email.sent) {
      console.error(`Invoice ${invoice.invoice_number}: PDF e-mail to ${customerEmail} failed`, email.error);
    }
  }

  return { id: invoice.id as string, invoiceNumber: invoice.invoice_number as string, createdProducts: extraProducts };
}

/** `Kaminofen X` → `kaminofen-x`; unique within the catalogue via a timestamp + index suffix. */
function makeSlug(name: string, index: number): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "produkt";
  return `${base}-${Date.now().toString(36)}-${index}`;
}
