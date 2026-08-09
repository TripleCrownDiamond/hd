/**
 * Which delivery zone a German postcode belongs to.
 *
 * Only one distinction changes the price: whether a forwarder can drive there.
 * Everything reachable by road is one mainland zone — Germany is small enough
 * that a pallet to Flensburg and a pallet to Garmisch cost a haulier the same
 * flat rate, and a distance-banded tariff would only be a guess. Islands
 * without a road link need a ferry or the Sylt car train, which is a real,
 * quotable extra.
 */

import type { DeliveryZone } from "./rates";

/**
 * Postcodes on islands with no road connection.
 *
 * Rügen, Usedom, Fehmarn and Poel are deliberately absent: they carry road
 * traffic over a bridge or causeway and ship at the mainland rate.
 */
const ISLAND_POSTCODES = new Set([
  // Nordfriesische Inseln und Halligen
  "25849", // Pellworm
  "25859", // Hooge
  "25863", // Langeneß
  "25938", // Föhr
  "25946", // Amrum
  "25980", // Sylt (Westerland, Rantum)
  "25992", // List auf Sylt
  "25996", // Wenningstedt
  "25997", // Hörnum
  "25999", // Kampen
  // Ostfriesische Inseln
  "26465", // Langeoog
  "26474", // Spiekeroog
  "26486", // Wangerooge
  "26548", // Norderney
  "26571", // Juist
  "26579", // Baltrum
  "26757", // Borkum
  // Helgoland und Neuwerk
  "27498",
  "27499",
  // Ostsee
  "18565", // Hiddensee
  // Chiemsee (Herren- und Fraueninsel)
  "83256",
]);

export function isIslandPostcode(postcode: string): boolean {
  return ISLAND_POSTCODES.has(postcode);
}

export function zoneForPostcode(postcode: string): DeliveryZone {
  return isIslandPostcode(postcode) ? "island" : "mainland";
}

export const ZONE_LABEL: Record<DeliveryZone, string> = {
  mainland: "Deutschland (Festland)",
  island: "Deutsche Insel ohne Straßenanbindung",
};
