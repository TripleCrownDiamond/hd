import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { BRAND_NAME } from "@/lib/brand";

const safe = (value: unknown) => String(value ?? "").replace(/[\u2013\u2014]/g, "-").replace(/[^\x20-\x7E\u00C0-\u00FF]/g, "");
const money = (cents: number) => `${new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)} EUR`;

/** An uploaded PNG or JPEG logo from `public/`, if one is configured. */
function configuredLogoPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const value = String(url).trim();
  if (!value.startsWith("/") || value.includes("..")) return null;
  const lower = value.toLowerCase();
  if (!lower.endsWith(".png") && !lower.endsWith(".jpg") && !lower.endsWith(".jpeg")) return null;
  return value;
}

export async function generateInvoicePdf(snapshot: Record<string, any>) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const dark = rgb(0.1, 0.16, 0.12);
  const muted = rgb(0.45, 0.48, 0.46);
  let y = 790;
  const draw = (text: unknown, x: number, size = 10, isBold = false, color = dark) => page.drawText(safe(text), { x, y, size, font: isBold ? bold : regular, color });

  // An uploaded company logo wins. With none configured we set the wordmark in
  // its two brand colours rather than embedding an image — there is no logo
  // bitmap in the repository, the mark is drawn in the browser.
  const localLogo = configuredLogoPath(snapshot.company?.logoUrl);
  let logoDrawn = false;
  if (localLogo) {
    try {
      const bytes = await readFile(join(process.cwd(), "public", localLogo));
      const logo = localLogo.toLowerCase().endsWith(".png")
        ? await pdf.embedPng(bytes)
        : await pdf.embedJpg(bytes);
      const scale = Math.min(150 / logo.width, 42 / logo.height);
      page.drawImage(logo, { x: 42, y: y - 25, width: logo.width * scale, height: logo.height * scale });
      logoDrawn = true;
    } catch {
      logoDrawn = false;
    }
  }
  if (!logoDrawn) {
    const custom = snapshot.company?.name && snapshot.company.name !== BRAND_NAME ? String(snapshot.company.name) : null;
    if (custom) {
      draw(custom, 42, 18, true);
    } else {
      draw("HOLZ", 42, 18, true, rgb(0.29, 0.16, 0.1));
      page.drawText("DIREKT", { x: 42 + bold.widthOfTextAtSize("HOLZ", 18), y, size: 18, font: bold, color: rgb(0.09, 0.33, 0.19) });
    }
  }
  draw("RECHNUNG", 410, 18, true);
  y -= 65;
  draw(`${snapshot.company?.name ?? ""} ${snapshot.company?.legalForm ?? ""}`, 42, 8);
  y -= 12;
  draw(snapshot.company?.street, 42, 8);
  y -= 12;
  draw(`${snapshot.company?.postalCode ?? ""} ${snapshot.company?.city ?? ""}`, 42, 8);
  y -= 12;
  const companyCountry = snapshot.company?.countryCode ? String(snapshot.company.countryCode) : "";
  if (companyCountry) draw(companyCountry, 42, 8, false, muted);

  y -= 26;
  draw(snapshot.customer?.name, 42, 11, true);
  y -= 15;
  draw(`${snapshot.customer?.street ?? ""} ${snapshot.customer?.houseNumber ?? ""}`, 42);
  y -= 14;
  draw(`${snapshot.customer?.postcode ?? ""} ${snapshot.customer?.city ?? ""}`, 42);

  y -= 45;
  draw(`Rechnungsnummer: ${snapshot.invoiceNumber}`, 350, 10, true);
  y -= 14;
  draw(`Rechnungsdatum: ${snapshot.issueDate}`, 350);
  y -= 14;
  draw(`Bestellung: ${snapshot.orderNumber}`, 350);
  y -= 14;
  draw(`Fällig am: ${snapshot.dueDate}`, 350);

  y -= 38;
  draw("Pos.", 42, 9, true);
  draw("Artikel", 78, 9, true);
  draw("Menge", 360, 9, true);
  draw("Einzelpreis", 425, 9, true);
  draw("Gesamt", 525, 9, true);
  y -= 10;
  page.drawLine({ start: { x: 42, y }, end: { x: 553, y }, thickness: 0.8, color: dark });
  y -= 18;
  for (const [index, item] of (snapshot.items ?? []).entries()) {
    if (y < 145) {
      page = pdf.addPage([595.28, 841.89]);
      y = 790;
    }
    draw(index + 1, 42);
    draw(safe(item.name).slice(0, 44), 78);
    draw(item.quantity, 370);
    draw(money(item.unitPriceCents), 425);
    draw(money(item.lineTotalCents), 510);
    y -= 19;
  }
  y -= 8;
  page.drawLine({ start: { x: 350, y }, end: { x: 553, y }, thickness: 0.6, color: dark });
  y -= 18;
  draw("Zwischensumme", 380);
  draw(money(snapshot.amounts.subtotalCents), 500);
  if (snapshot.amounts.discountCents > 0) {
    y -= 16;
    draw("Rabatt", 380);
    draw(`-${money(snapshot.amounts.discountCents)}`, 500);
  }
  y -= 16;
  draw("Versand", 380);
  draw(money(snapshot.amounts.shippingCents), 500);
  y -= 16;
  const taxRate = Number(snapshot.taxRate ?? 19);
  draw(`Enthaltene MwSt. (${taxRate} %)`, 380);
  draw(money(snapshot.amounts.taxCents), 500);
  y -= 20;
  draw("Gesamtbetrag", 380, 11, true);
  draw(money(snapshot.amounts.totalCents), 500, 11, true);

  // Legal footer: the full company block required on German invoices.
  y = 92;
  page.drawLine({ start: { x: 42, y: y + 12 }, end: { x: 553, y: y + 12 }, thickness: 0.5, color: rgb(0.55, 0.58, 0.56) });
  const legal: Array<[string, string]> = [];
  if (snapshot.company?.vatId) legal.push(["USt-IdNr.", String(snapshot.company.vatId)]);
  if (snapshot.company?.taxNumber) legal.push(["Steuernummer", String(snapshot.company.taxNumber)]);
  if (snapshot.company?.commercialRegister && snapshot.company?.registerCourt) {
    legal.push(["Handelsregister", `${snapshot.company.registerCourt}, ${snapshot.company.commercialRegister}`]);
  }
  if (snapshot.company?.managingDirector) legal.push(["Geschäftsführer", String(snapshot.company.managingDirector)]);
  const legalLine = legal.map(([label, value]) => `${label}: ${value}`).join("   |   ");
  if (legalLine) {
    draw(legalLine, 42, 7, false, muted);
    y -= 11;
  }
  draw(snapshot.company?.footer || "", 42, 7);
  y -= 11;
  const contact = [
    snapshot.company?.email ? `E-Mail: ${snapshot.company.email}` : "",
    snapshot.company?.phone ? `Tel.: ${snapshot.company.phone}` : "",
  ].filter(Boolean).join("   |   ");
  if (contact) draw(contact, 42, 7, false, muted);

  pdf.setTitle(`Rechnung ${snapshot.invoiceNumber}`);
  pdf.setAuthor(snapshot.company?.name || "HolzDirekt");
  pdf.setCreationDate(new Date(snapshot.issuedAt));
  return pdf.save();
}
