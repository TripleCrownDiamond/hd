import { describe, it, expect, beforeAll, vi } from "vitest";
import { mkdir, writeFile } from "node:fs/promises";

vi.mock("server-only", () => ({}));

describe("email template samples", () => {
  beforeAll(async () => {
    await mkdir("tmp", { recursive: true });
  });
  it("writes order, status and invoice HTML with the embedded logo", async () => {
    const { orderConfirmationEmail, statusUpdateEmail, invoiceEmail } = await import("./templates");
    const data = {
      orderNumber: "2026-000003",
      customerName: "Max Mustermann",
      lines: [
        { name: "Brennholz Buche 33 cm – 1 RM", quantity: 2, lineTotalCents: 21600 },
        { name: "Kaminofen Hark 105 GT ECOplus", quantity: 1, lineTotalCents: 417900 },
      ],
      subtotalCents: 439500,
      shippingCents: 6900,
      totalCents: 446400,
      paymentLabel: "Vorkasse per Banküberweisung",
      paymentReference: "HK-2026-000003",
      bank: { accountHolder: "holz direkt GmbH", iban: "DE89 3704 0044 0532 0130 00", bic: "COBADEFFXXX" },
      address: { street: "Bergweg", houseNumber: "1", postcode: "48485", city: "Neuenkirchen" },
    };
    const order = orderConfirmationEmail(data);
    const status = statusUpdateEmail({ orderNumber: data.orderNumber, customerName: data.customerName, statusLabel: "Versandt", message: "Ihre Bestellung wurde versandt.", tracking: { carrier: "DHL", number: "1234567890", url: "https://www.dhl.de/tracking" } });
    const invoice = invoiceEmail({ invoiceNumber: "RE-2026-000001", orderNumber: data.orderNumber, customerName: data.customerName, companyName: "holz direkt GmbH - Holzimport", totalCents: 446400 });
    await Promise.all([
      writeFile("tmp/email-order.html", order.html),
      writeFile("tmp/email-status.html", status.html),
      writeFile("tmp/email-invoice.html", invoice.html),
    ]);
    expect(order.html).toContain("data:image/png;base64,");
    expect(order.html).toContain("Bergweg 24");
    expect(invoice.html).toContain("RE-2026-000001");
    expect(status.html).toContain("Sendung verfolgen");
  }, 30_000);
});
