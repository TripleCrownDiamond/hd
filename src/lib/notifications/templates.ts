/**
 * Self-contained HTML for transactional email.
 *
 * No external CSS or images: many mail clients strip both, so everything is
 * inline and the layout survives on its own. The logo is embedded as a data
 * URI (public/logo.png, ~7 kB) — it is a plain bitmap, so no external fetch.
 * Amounts arrive already formatted.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BRAND_NAME as BRAND } from "@/lib/brand";

// Brand palette (oklch tokens converted to hex, see globals.css).
const WOOD = "#4a2e1b"; // --color-wood · HOLZ brown
const FOREST = "#1f6b3b"; // --color-brand · DIREKT green
const INK = "#26211c";
const MUTED = "#8a8079";
const LINE = "#e7e1d8";
const PAPER = "#f5f3ef";
const CARD = "#ffffff";

let logoDataUri: string | null = null;
function logoUri(): string | null {
  if (logoDataUri !== null) return logoDataUri;
  try {
    const bytes = readFileSync(join(process.cwd(), "public", "logo.png"));
    logoDataUri = `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    logoDataUri = null; // no logo on disk (tests, minimal install): fall back to wordmark
  }
  return logoDataUri;
}

function money(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

function layout(title: string, inner: string): string {
  const uri = logoUri();
  const wordmark = uri
    ? `<img src="${uri}" alt="${BRAND}" style="display:block;height:34px;width:auto;border:0;" />`
    : `<div style="font-size:20px;font-weight:700;letter-spacing:0.02em;color:${WOOD};">${BRAND}</div>`;
  return `<!doctype html><html lang="de"><body style="margin:0;background:${PAPER};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">
<div style="max-width:560px;margin:0 auto;padding:24px;">
  <div style="background:${CARD};border:1px solid ${LINE};border-radius:12px;padding:20px 24px 0;">
    <div style="border-bottom:2px solid ${FOREST};padding-bottom:16px;">${wordmark}</div>
    <div style="padding:20px 0;">
      <h1 style="margin:0 0 12px;font-size:20px;color:${WOOD};">${title}</h1>
      ${inner}
    </div>
  </div>
  <p style="color:${MUTED};font-size:12px;margin-top:16px;line-height:1.6;">${BRAND} · Bergweg 24 · 48485 Neuenkirchen · kontakt@holzdirekt.store<br/>Diese E-Mail wurde automatisch versendet. Bitte nicht direkt beantworten.</p>
</div></body></html>`;
}

export interface OrderEmailLine {
  name: string;
  quantity: number;
  lineTotalCents: number;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  lines: OrderEmailLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  paymentLabel: string;
  paymentReference: string | null;
  bank?: { accountHolder: string; iban: string; bic: string | null } | null;
  /** When set, the order is paid by Anzahlung and only the deposit is due now. */
  deposit?: { percent: number; amountCents: number; remainingCents: number } | null;
  address: { street: string; houseNumber: string; postcode: string; city: string; country?: string };
}

function lineTable(lines: OrderEmailLine[]): string {
  const rows = lines
    .map(
      (line) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid ${LINE};">${line.quantity} × ${line.name}</td><td style="padding:8px 0;border-bottom:1px solid ${LINE};text-align:right;white-space:nowrap;">${money(line.lineTotalCents)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>`;
}

function totals(data: OrderEmailData): string {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px;">
<tr><td style="padding:6px 0;color:${MUTED};">Zwischensumme</td><td style="padding:6px 0;text-align:right;">${money(data.subtotalCents)}</td></tr>
<tr><td style="padding:6px 0;color:${MUTED};">Versand</td><td style="padding:6px 0;text-align:right;">${data.shippingCents === 0 ? "kostenlos" : money(data.shippingCents)}</td></tr>
<tr><td style="padding:10px 0 0;border-top:2px solid ${FOREST};font-weight:700;font-size:15px;">Gesamt</td><td style="padding:10px 0 0;border-top:2px solid ${FOREST};text-align:right;font-weight:700;font-size:15px;">${money(data.totalCents)}</td></tr>
</table>`;
}

function bankBlock(data: OrderEmailData): string {
  if (!data.bank || !data.paymentReference) return "";
  const headline = data.deposit ? "Bitte überweisen Sie die Anzahlung:" : "Bitte überweisen Sie den Betrag:";
  const amount = data.deposit
    ? `Anzahlung (${data.deposit.percent} %): <strong>${money(data.deposit.amountCents)}</strong><br>Restbetrag (nach Lieferung): <strong>${money(data.deposit.remainingCents)}</strong>`
    : `Betrag: <strong>${money(data.totalCents)}</strong>`;
  return `<div style="background:#f3f7f1;border:1px solid #dce8d8;border-radius:8px;padding:16px;margin-top:16px;font-size:14px;">
<strong style="color:${FOREST};">${headline}</strong>
<div style="margin-top:8px;line-height:1.7;">Kontoinhaber: ${data.bank.accountHolder}<br>IBAN: <span style="font-family:monospace;">${data.bank.iban}</span>${data.bank.bic ? `<br>BIC: ${data.bank.bic}` : ""}<br>Verwendungszweck: <strong>${data.paymentReference}</strong><br>${amount}</div></div>`;
}

/** Confirmation for the customer. */
export function orderConfirmationEmail(data: OrderEmailData): { subject: string; html: string; text: string } {
  const subject = `Ihre Bestellung ${data.orderNumber} bei ${BRAND}`;
  const inner = `<p>Hallo ${data.customerName},</p>
<p>vielen Dank für Ihre Bestellung. Wir haben sie erhalten und bearbeiten sie in Kürze.</p>
<div style="background:#f3f7f1;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:14px;">Bestellnummer: <strong style="color:${INK};">${data.orderNumber}</strong> · Zahlung: ${data.paymentLabel}</div>
${lineTable(data.lines)}
${totals(data)}
${bankBlock(data)}
<div style="font-size:14px;margin-top:16px;padding-top:16px;border-top:1px solid ${LINE};"><strong>Lieferadresse</strong><br/>${data.address.street} ${data.address.houseNumber}, ${data.address.postcode} ${data.address.city}${data.address.country ? `, ${data.address.country}` : ""}</div>`;
  const text = [
    `Hallo ${data.customerName},`,
    `vielen Dank für Ihre Bestellung ${data.orderNumber}.`,
    ...data.lines.map((line) => `- ${line.quantity} x ${line.name}: ${money(line.lineTotalCents)}`),
    `Versand: ${data.shippingCents === 0 ? "kostenlos" : money(data.shippingCents)}`,
    `Gesamt: ${money(data.totalCents)}`,
    data.bank && data.paymentReference
      ? data.deposit
        ? `Anzahlung (${data.deposit.percent} %): ${money(data.deposit.amountCents)} per Überweisung an ${data.bank.accountHolder}, IBAN ${data.bank.iban}, Verwendungszweck ${data.paymentReference}. Restbetrag: ${money(data.deposit.remainingCents)}.`
        : `Überweisung an ${data.bank.accountHolder}, IBAN ${data.bank.iban}, Verwendungszweck ${data.paymentReference}.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  return { subject, html: layout("Bestellbestätigung", inner), text };
}

/** New-order alert for the shop. */
export function newOrderEmail(data: OrderEmailData): { subject: string; html: string; text: string } {
  const subject = `Neue Bestellung ${data.orderNumber} · ${money(data.totalCents)}`;
  const inner = `<p>Neue Bestellung von <strong>${data.customerName}</strong>.</p>
<div style="background:#f3f7f1;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:14px;">Zahlung: ${data.paymentLabel}${data.paymentReference ? ` · Referenz ${data.paymentReference}` : ""}</div>
${lineTable(data.lines)}
${totals(data)}
<div style="font-size:14px;margin-top:16px;padding-top:16px;border-top:1px solid ${LINE};"><strong>Lieferung</strong><br/>${data.address.street} ${data.address.houseNumber}, ${data.address.postcode} ${data.address.city}${data.address.country ? `, ${data.address.country}` : ""}</div>`;
  const text = `Neue Bestellung ${data.orderNumber} von ${data.customerName}: ${money(data.totalCents)} (${data.paymentLabel}).`;
  return { subject, html: layout(`Neue Bestellung ${data.orderNumber}`, inner), text };
}

export interface InvoiceEmailData {
  invoiceNumber: string;
  /** Set for order invoices; a standalone invoice has no order. */
  orderNumber?: string | null;
  customerName: string;
  companyName: string;
  totalCents: number;
}

/** The issued invoice PDF is attached by the caller; this is the cover mail. */
export function invoiceEmail(data: InvoiceEmailData): { subject: string; html: string; text: string } {
  const subject = `Ihre Rechnung ${data.invoiceNumber}`;
  const reference = data.orderNumber
    ? ` zu Ihrer Bestellung ${data.orderNumber}`
    : " für die erbrachte Leistung";
  const inner = `<p>Hallo ${data.customerName},</p>
<p>anbei erhalten Sie die Rechnung <strong>${data.invoiceNumber}</strong>${reference} als PDF-Dokument.</p>
<div style="background:#f3f7f1;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:14px;">Rechnungsnummer: <strong style="color:${INK};">${data.invoiceNumber}</strong> · Betrag: <strong style="color:${INK};">${money(data.totalCents)}</strong></div>
<p>Mit freundlichen Grüßen<br/><strong>${data.companyName}</strong></p>`;
  const text = `Hallo ${data.customerName},\nanbei erhalten Sie die Rechnung ${data.invoiceNumber}${reference}.\nBetrag: ${money(data.totalCents)}\n\nMit freundlichen Grüßen\n${data.companyName}`;
  return { subject, html: layout("Ihre Rechnung", inner), text };
}

export interface StatusEmailData {
  orderNumber: string;
  customerName: string;
  statusLabel: string;
  message: string;
  tracking?: { carrier: string; number: string; url: string | null } | null;
}

/** Status change for the customer (paid, shipped, delivered …). */
export function statusUpdateEmail(data: StatusEmailData): { subject: string; html: string; text: string } {
  const subject = `Ihre Bestellung ${data.orderNumber}: ${data.statusLabel}`;
  const trackingBlock = data.tracking
    ? `<div style="background:#f3f7f1;border:1px solid #dce8d8;border-radius:8px;padding:16px;margin-top:16px;font-size:14px;"><strong>Sendungsverfolgung</strong><br/>${data.tracking.carrier}: <strong>${data.tracking.number}</strong>${data.tracking.url ? `<br/><a href="${data.tracking.url}" style="display:inline-block;margin-top:10px;background:${FOREST};color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Sendung verfolgen</a>` : ""}</div>`
    : "";
  const inner = `<p>Hallo ${data.customerName},</p><p style="font-size:15px;">${data.message}</p>
<div style="background:#f3f7f1;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:14px;">Bestellnummer: <strong style="color:${INK};">${data.orderNumber}</strong> · Status: <strong style="color:${FOREST};">${data.statusLabel}</strong></div>${trackingBlock}`;
  const text = [
    `Hallo ${data.customerName},`,
    data.message,
    `Bestellung ${data.orderNumber} — Status: ${data.statusLabel}.`,
    data.tracking ? `Sendungsverfolgung ${data.tracking.carrier}: ${data.tracking.number}${data.tracking.url ? ` (${data.tracking.url})` : ""}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return { subject, html: layout(data.statusLabel, inner), text };
}
