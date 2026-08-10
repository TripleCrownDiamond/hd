/**
 * Plain, self-contained HTML for transactional email.
 *
 * No external CSS or images: many mail clients strip both, so everything is
 * inline and the layout survives on its own. Amounts arrive already formatted.
 */

import { BRAND_NAME as BRAND } from "@/lib/brand";

function money(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

function layout(title: string, inner: string): string {
  return `<!doctype html><html lang="de"><body style="margin:0;background:#f5f3ef;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#26211c;">
<div style="max-width:560px;margin:0 auto;padding:24px;">
  <div style="font-size:20px;font-weight:700;letter-spacing:0.02em;color:#7a3b12;">${BRAND}</div>
  <div style="background:#ffffff;border:1px solid #e7e1d8;border-radius:12px;padding:24px;margin-top:16px;">
    <h1 style="margin:0 0 12px;font-size:20px;">${title}</h1>
    ${inner}
  </div>
  <p style="color:#8a8079;font-size:12px;margin-top:16px;">${BRAND} · Diese E-Mail wurde automatisch versendet.</p>
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
  address: { street: string; houseNumber: string; postcode: string; city: string; country?: string };
}

function lineTable(lines: OrderEmailLine[]): string {
  const rows = lines
    .map(
      (line) =>
        `<tr><td style="padding:6px 0;">${line.quantity} × ${line.name}</td><td style="padding:6px 0;text-align:right;white-space:nowrap;">${money(line.lineTotalCents)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>`;
}

function totals(data: OrderEmailData): string {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px;border-top:1px solid #e7e1d8;">
<tr><td style="padding:6px 0;color:#8a8079;">Zwischensumme</td><td style="padding:6px 0;text-align:right;">${money(data.subtotalCents)}</td></tr>
<tr><td style="padding:6px 0;color:#8a8079;">Versand</td><td style="padding:6px 0;text-align:right;">${data.shippingCents === 0 ? "kostenlos" : money(data.shippingCents)}</td></tr>
<tr><td style="padding:8px 0;font-weight:700;">Gesamt</td><td style="padding:8px 0;text-align:right;font-weight:700;">${money(data.totalCents)}</td></tr>
</table>`;
}

function bankBlock(data: OrderEmailData): string {
  if (!data.bank || !data.paymentReference) return "";
  return `<div style="background:#f7f4ef;border-radius:8px;padding:16px;margin-top:16px;font-size:14px;">
<strong>Bitte überweisen Sie den Betrag:</strong>
<div style="margin-top:8px;">Kontoinhaber: ${data.bank.accountHolder}<br>IBAN: <span style="font-family:monospace;">${data.bank.iban}</span>${data.bank.bic ? `<br>BIC: ${data.bank.bic}` : ""}<br>Verwendungszweck: <strong>${data.paymentReference}</strong><br>Betrag: <strong>${money(data.totalCents)}</strong></div></div>`;
}

/** Confirmation for the customer. */
export function orderConfirmationEmail(data: OrderEmailData): { subject: string; html: string; text: string } {
  const subject = `Ihre Bestellung ${data.orderNumber} bei ${BRAND}`;
  const inner = `<p>Hallo ${data.customerName},</p>
<p>vielen Dank für Ihre Bestellung. Wir haben sie erhalten und bearbeiten sie in Kürze.</p>
<p style="font-size:14px;color:#8a8079;">Bestellnummer: <strong style="color:#26211c;">${data.orderNumber}</strong> · Zahlung: ${data.paymentLabel}</p>
${lineTable(data.lines)}
${totals(data)}
${bankBlock(data)}
<p style="font-size:14px;margin-top:16px;">Lieferadresse: ${data.address.street} ${data.address.houseNumber}, ${data.address.postcode} ${data.address.city}${data.address.country ? `, ${data.address.country}` : ""}</p>`;
  const text = [
    `Hallo ${data.customerName},`,
    `vielen Dank für Ihre Bestellung ${data.orderNumber}.`,
    ...data.lines.map((line) => `- ${line.quantity} x ${line.name}: ${money(line.lineTotalCents)}`),
    `Versand: ${data.shippingCents === 0 ? "kostenlos" : money(data.shippingCents)}`,
    `Gesamt: ${money(data.totalCents)}`,
    data.bank && data.paymentReference
      ? `Überweisung an ${data.bank.accountHolder}, IBAN ${data.bank.iban}, Verwendungszweck ${data.paymentReference}.`
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
<p style="font-size:14px;color:#8a8079;">Zahlung: ${data.paymentLabel}${data.paymentReference ? ` · Referenz ${data.paymentReference}` : ""}</p>
${lineTable(data.lines)}
${totals(data)}
<p style="font-size:14px;margin-top:16px;">Lieferung: ${data.address.street} ${data.address.houseNumber}, ${data.address.postcode} ${data.address.city}${data.address.country ? `, ${data.address.country}` : ""}</p>`;
  const text = `Neue Bestellung ${data.orderNumber} von ${data.customerName}: ${money(data.totalCents)} (${data.paymentLabel}).`;
  return { subject, html: layout(`Neue Bestellung ${data.orderNumber}`, inner), text };
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
    ? `<div style="background:#f7f4ef;border-radius:8px;padding:16px;margin-top:16px;font-size:14px;">Sendungsverfolgung ${data.tracking.carrier}: <strong>${data.tracking.number}</strong>${data.tracking.url ? `<br><a href="${data.tracking.url}" style="color:#7a3b12;">Sendung verfolgen</a>` : ""}</div>`
    : "";
  const inner = `<p>Hallo ${data.customerName},</p><p>${data.message}</p>
<p style="font-size:14px;color:#8a8079;">Bestellnummer: <strong style="color:#26211c;">${data.orderNumber}</strong> · Status: ${data.statusLabel}</p>${trackingBlock}`;
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
