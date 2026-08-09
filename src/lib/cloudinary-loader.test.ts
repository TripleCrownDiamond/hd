import { describe, expect, it } from "vitest";
import cloudinaryLoader from "./cloudinary-loader";

const BASE = "https://res.cloudinary.com/pq4soawt/image/upload";

describe("cloudinaryLoader", () => {
  it("keeps square fill crops square at the requested responsive width", () => {
    expect(
      cloudinaryLoader({
        src: `${BASE}/f_auto,q_auto,c_fill,w_600,h_600/products/stove`,
        width: 828,
      }),
    ).toBe(`${BASE}/f_auto,q_auto,c_fill,g_auto,w_828,h_828/products/stove`);
  });

  it("keeps non-square imagery proportional", () => {
    expect(
      cloudinaryLoader({
        src: `${BASE}/f_auto,q_auto,c_fill,w_1200,h_800/editorial/hero`,
        width: 828,
      }),
    ).toBe(`${BASE}/f_auto,q_auto,c_limit,w_828/editorial/hero`);
  });
});
