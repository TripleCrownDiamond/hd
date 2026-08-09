import "server-only";

import { getMigrationAwarePublicSupabase } from "@/lib/db/server";
import { issueInvoiceForOrder } from "./issue";

/** When the shop wants an invoice raised, from `site_settings.invoice_trigger`. */
export type InvoiceTrigger = "manual" | "order" | "payment" | "shipment";

/**
 * Raise the invoice if this moment is the one the shop configured.
 *
 * The setting existed in the admin and in the database but nothing read it, so
 * every invoice had to be issued by hand no matter what it said.
 *
 * Best-effort by design. `issueInvoiceForOrder` throws when the company address
 * or tax number is missing and when an invoice already exists — neither is a
 * reason to fail the customer's order or refuse a status change. The failure is
 * logged and the invoice stays available from the admin.
 */
export async function maybeIssueInvoice(
  orderId: string,
  moment: Exclude<InvoiceTrigger, "manual">,
): Promise<{ issued: boolean; invoiceNumber?: string; reason?: string }> {
  let trigger: InvoiceTrigger = "manual";
  try {
    const { data } = await getMigrationAwarePublicSupabase()
      .from("site_settings")
      .select("invoice_trigger")
      .eq("id", 1)
      .maybeSingle();
    trigger = ((data as { invoice_trigger?: InvoiceTrigger } | null)?.invoice_trigger ??
      "manual") as InvoiceTrigger;
  } catch {
    return { issued: false, reason: "settings_unavailable" };
  }

  if (trigger !== moment) return { issued: false, reason: "trigger_not_matched" };

  try {
    const invoice = await issueInvoiceForOrder(orderId);
    return { issued: true, invoiceNumber: invoice.invoiceNumber };
  } catch (error) {
    console.error(
      "Automatic invoice failed",
      orderId,
      error instanceof Error ? error.message : error,
    );
    return { issued: false, reason: "issue_failed" };
  }
}
