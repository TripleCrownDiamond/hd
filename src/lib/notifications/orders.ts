import "server-only";

/**
 * Fan an order event out to every configured channel.
 *
 * Purchase and status changes each reach the customer by email and the shop by
 * email and Telegram. Every channel is independent and best-effort: one being
 * down or unconfigured never affects the others, and never affects the order.
 */

import { sendEmail, adminInbox } from "./resend";
import { sendTelegram, escapeHtml } from "./telegram";
import {
  newOrderEmail,
  orderConfirmationEmail,
  statusUpdateEmail,
  type OrderEmailData,
  type StatusEmailData,
} from "./templates";

function money(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export async function notifyOrderPlaced(data: OrderEmailData, customerEmail: string): Promise<void> {
  const customer = orderConfirmationEmail(data);
  const admin = newOrderEmail(data);
  const inbox = adminInbox();

  const lines = data.lines.map((line) => `• ${line.quantity}× ${escapeHtml(line.name)} — ${money(line.lineTotalCents)}`).join("\n");
  const telegram =
    `<b>Neue Bestellung ${escapeHtml(data.orderNumber)}</b>\n` +
    `${escapeHtml(data.customerName)}\n${lines}\n` +
    `Versand: ${data.shippingCents === 0 ? "kostenlos" : money(data.shippingCents)}\n` +
    `<b>Gesamt: ${money(data.totalCents)}</b>\n` +
    `Zahlung: ${escapeHtml(data.paymentLabel)}${data.paymentReference ? ` (${escapeHtml(data.paymentReference)})` : ""}\n` +
    `${escapeHtml(data.address.street)} ${escapeHtml(data.address.houseNumber)}, ${escapeHtml(data.address.postcode)} ${escapeHtml(data.address.city)}`;

  await Promise.allSettled([
    sendEmail({ to: customerEmail, ...customer }),
    inbox ? sendEmail({ to: inbox, ...admin, replyTo: customerEmail }) : Promise.resolve(),
    sendTelegram(telegram),
  ]);
}

export async function notifyStatusChange(
  data: StatusEmailData,
  customerEmail: string,
): Promise<void> {
  const email = statusUpdateEmail(data);
  const telegram =
    `<b>Bestellung ${escapeHtml(data.orderNumber)}</b>: ${escapeHtml(data.statusLabel)}\n` +
    (data.tracking ? `${escapeHtml(data.tracking.carrier)} ${escapeHtml(data.tracking.number)}` : "");

  await Promise.allSettled([
    sendEmail({ to: customerEmail, ...email }),
    sendTelegram(telegram),
  ]);
}
