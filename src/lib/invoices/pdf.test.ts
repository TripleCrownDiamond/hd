import { beforeAll, describe, expect, it, vi } from "vitest";
import { mkdir, writeFile } from "node:fs/promises";

vi.mock("server-only", () => ({}));

describe("invoice PDF", () => {
  beforeAll(async () => { await mkdir("tmp", { recursive: true }); });
  it("embeds the local PNG logo when configured", async () => {
    const { generateInvoicePdf } = await import("./pdf");
    const { writeFile: writeLogo } = await import("node:fs/promises");
    await mkdir("public", { recursive: true });
    // A distinct test file so the real public/logo.png is never overwritten.
    await writeLogo("public/logo-test.png", Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));
    const bytes = await generateInvoicePdf({ invoiceNumber: "RE-2026-000002", issuedAt: "2026-08-02T12:00:00.000Z", issueDate: "02.08.2026", dueDate: "16.08.2026", orderNumber: "2026-000002", taxRate: 19, company: { name: "HolzDirekt", legalForm: "GmbH", street: "Musterstraße 1", postalCode: "10115", city: "Berlin", logoUrl: "/logo-test.png", vatId: "DE000000000" }, customer: { name: "Max Mustermann", street: "Kundenweg", houseNumber: "12", postcode: "20095", city: "Hamburg" }, items: [{ name: "Extra Service", quantity: 1, unitPriceCents: 14900, lineTotalCents: 14900 }], amounts: { subtotalCents: 14900, discountCents: 0, shippingCents: 0, taxCents: 2380, totalCents: 14900 } });
    expect(bytes.byteLength).toBeGreaterThan(1000);
    const { rm } = await import("node:fs/promises");
    await rm("public/logo-test.png", { force: true });
  }, 30_000);
  it("generates a non-empty A4 invoice for visual QA", async () => {
    const { generateInvoicePdf } = await import("./pdf");
    const bytes = await generateInvoicePdf({ invoiceNumber: "RE-2026-000001", issuedAt: "2026-08-02T12:00:00.000Z", issueDate: "02.08.2026", dueDate: "16.08.2026", orderNumber: "2026-000001", taxRate: 19, company: { name: "HolzDirekt", legalForm: "GmbH", street: "Musterstraße 1", postalCode: "10115", city: "Berlin", countryCode: "DE", vatId: "DE000000000", taxNumber: null, commercialRegister: "HRB 12345", registerCourt: "Amtsgericht Berlin", managingDirector: "Max Mustermann", email: "office@holzdirekt.store", phone: "+49 30 123456", footer: "Vielen Dank für Ihre Bestellung." }, customer: { name: "Max Mustermann", street: "Kundenweg", houseNumber: "12", postcode: "20095", city: "Hamburg" }, items: [{ name: "Kaminofen Beispielmodell", quantity: 1, unitPriceCents: 249900, lineTotalCents: 249900 }, { name: "Brennholz Buche 33 cm", quantity: 2, unitPriceCents: 8999, lineTotalCents: 17998 }], amounts: { subtotalCents: 267898, discountCents: 1000, shippingCents: 4900, taxCents: 43473, totalCents: 271798 } });
    expect(bytes.byteLength).toBeGreaterThan(1000); await writeFile("tmp/invoice-sample.pdf", bytes);
    // Embedding fonts and laying out the page takes ~1.2s idle but overruns the
    // 5s default whenever the machine is also building. Flaky here reads as a
    // broken invoice, so give it room rather than let it cry wolf.
  }, 30_000);
});
