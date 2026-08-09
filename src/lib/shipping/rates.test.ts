import { describe, expect, it } from "vitest";
import {
  FREE_SHIPPING_FROM_CENTS,
  ISLAND_SURCHARGE_CENTS,
  SHIPPING_RATES,
  dominantClass,
  quoteShipping,
  shippingClassFor,
} from "./rates";
import { isIslandPostcode, zoneForPostcode } from "./zones";

describe("shippingClassFor", () => {
  it("sends solid fuels by forwarder and a stove on a tail lift", () => {
    expect(shippingClassFor("wood")).toBe("freight");
    expect(shippingClassFor("pellet")).toBe("freight");
    expect(shippingClassFor("coal")).toBe("freight");
    expect(shippingClassFor("stove")).toBe("bulky");
    expect(shippingClassFor("accessory")).toBe("parcel");
    expect(shippingClassFor("kindling")).toBe("parcel");
  });
});

describe("dominantClass", () => {
  it("charges one shipment at the dearest class it contains", () => {
    expect(dominantClass(["parcel", "freight"])).toBe("freight");
    expect(dominantClass(["freight", "bulky", "parcel"])).toBe("bulky");
    expect(dominantClass([])).toBe("parcel");
  });
});

describe("zoneForPostcode", () => {
  it("marks islands without a road link", () => {
    expect(zoneForPostcode("25980")).toBe("island"); // Sylt
    expect(zoneForPostcode("26571")).toBe("island"); // Juist
    expect(zoneForPostcode("27498")).toBe("island"); // Helgoland
  });

  it("treats bridge- and causeway-connected islands as mainland", () => {
    // Rügen, Fehmarn and Poel carry road traffic and ship at the normal rate.
    expect(isIslandPostcode("18528")).toBe(false);
    expect(isIslandPostcode("23769")).toBe(false);
    expect(isIslandPostcode("23999")).toBe(false);
    expect(zoneForPostcode("10115")).toBe("mainland");
  });
});

describe("quoteShipping", () => {
  it("prices a pallet of firewood on the mainland", () => {
    const quote = quoteShipping({ subtotalCents: 25_000, kinds: ["wood"], zone: "mainland" });
    expect(quote.totalCents).toBe(SHIPPING_RATES.freight);
    expect(quote.free).toBe(false);
    expect(quote.remainingForFreeCents).toBe(FREE_SHIPPING_FROM_CENTS - 25_000);
  });

  it("adds the ferry surcharge for freight to an island", () => {
    const quote = quoteShipping({ subtotalCents: 25_000, kinds: ["pellet"], zone: "island" });
    expect(quote.surchargeCents).toBe(ISLAND_SURCHARGE_CENTS);
    expect(quote.totalCents).toBe(SHIPPING_RATES.freight + ISLAND_SURCHARGE_CENTS);
  });

  it("does not surcharge a parcel to an island", () => {
    // A parcel carrier serves the islands at its normal rate.
    const quote = quoteShipping({ subtotalCents: 3_000, kinds: ["accessory"], zone: "island" });
    expect(quote.surchargeCents).toBe(0);
    expect(quote.totalCents).toBe(SHIPPING_RATES.parcel);
  });

  it("is free from the threshold, surcharge included", () => {
    const quote = quoteShipping({
      subtotalCents: FREE_SHIPPING_FROM_CENTS,
      kinds: ["stove"],
      zone: "island",
    });
    expect(quote.free).toBe(true);
    expect(quote.totalCents).toBe(0);
    expect(quote.remainingForFreeCents).toBe(0);
  });

  it("charges one cent below the threshold", () => {
    const quote = quoteShipping({
      subtotalCents: FREE_SHIPPING_FROM_CENTS - 1,
      kinds: ["wood"],
      zone: "mainland",
    });
    expect(quote.free).toBe(false);
    expect(quote.remainingForFreeCents).toBe(1);
  });

  it("charges the stove rate when a basket mixes classes", () => {
    const quote = quoteShipping({
      subtotalCents: 50_000,
      kinds: ["accessory", "wood", "stove"],
      zone: "mainland",
    });
    expect(quote.shippingClass).toBe("bulky");
    expect(quote.totalCents).toBe(SHIPPING_RATES.bulky);
  });
});
