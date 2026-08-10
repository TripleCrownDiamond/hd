/**
 * Countries the shop delivers to.
 *
 * The checkout offers every European country, and the server accepts exactly
 * this set. Labels are German because the storefront UI is de-DE. Russia and
 * Belarus are deliberately absent: EU sanctions make shipping there legally
 * unreliable, and the tariff has no sensible value for them.
 */

export interface CountryOption {
  code: string;
  label: string;
}

export const EUROPEAN_COUNTRIES: CountryOption[] = [
  { code: "DE", label: "Deutschland" },
  { code: "AT", label: "Österreich" },
  { code: "BE", label: "Belgien" },
  { code: "BG", label: "Bulgarien" },
  { code: "HR", label: "Kroatien" },
  { code: "CY", label: "Zypern" },
  { code: "CZ", label: "Tschechien" },
  { code: "DK", label: "Dänemark" },
  { code: "EE", label: "Estland" },
  { code: "FI", label: "Finnland" },
  { code: "FR", label: "Frankreich" },
  { code: "GR", label: "Griechenland" },
  { code: "HU", label: "Ungarn" },
  { code: "IE", label: "Irland" },
  { code: "IT", label: "Italien" },
  { code: "LV", label: "Lettland" },
  { code: "LT", label: "Litauen" },
  { code: "LU", label: "Luxemburg" },
  { code: "MT", label: "Malta" },
  { code: "NL", label: "Niederlande" },
  { code: "PL", label: "Polen" },
  { code: "PT", label: "Portugal" },
  { code: "RO", label: "Rumänien" },
  { code: "SK", label: "Slowakei" },
  { code: "SI", label: "Slowenien" },
  { code: "ES", label: "Spanien" },
  { code: "SE", label: "Schweden" },
  { code: "GB", label: "Vereinigtes Königreich" },
  { code: "CH", label: "Schweiz" },
  { code: "NO", label: "Norwegen" },
  { code: "IS", label: "Island" },
  { code: "AL", label: "Albanien" },
  { code: "BA", label: "Bosnien und Herzegowina" },
  { code: "GE", label: "Georgien" },
  { code: "AM", label: "Armenien" },
  { code: "MD", label: "Republik Moldau" },
  { code: "ME", label: "Montenegro" },
  { code: "MK", label: "Nordmazedonien" },
  { code: "RS", label: "Serbien" },
  { code: "XK", label: "Kosovo" },
  { code: "TR", label: "Türkei" },
  { code: "UA", label: "Ukraine" },
  { code: "AD", label: "Andorra" },
  { code: "LI", label: "Liechtenstein" },
  { code: "MC", label: "Monaco" },
  { code: "SM", label: "San Marino" },
  { code: "VA", label: "Vatikanstadt" },
];

export const EUROPEAN_COUNTRY_CODES: ReadonlySet<string> = new Set(
  EUROPEAN_COUNTRIES.map((country) => country.code),
);

export function isEuropeanCountry(code: string): boolean {
  return EUROPEAN_COUNTRY_CODES.has(code);
}

export function countryLabel(code: string): string {
  return EUROPEAN_COUNTRIES.find((country) => country.code === code)?.label ?? code;
}
