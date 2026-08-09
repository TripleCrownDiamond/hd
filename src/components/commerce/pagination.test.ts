import { describe, expect, it } from "vitest";
import { PAGE_SIZE, paginate } from "./pagination";

const items = Array.from({ length: 50 }, (_, index) => index);

describe("paginate", () => {
  it("returns the first page when no page is requested", () => {
    const slice = paginate(items, undefined);
    expect(slice.page).toBe(1);
    expect(slice.items).toHaveLength(PAGE_SIZE);
    expect(slice.items[0]).toBe(0);
    expect(slice.from).toBe(1);
    expect(slice.to).toBe(PAGE_SIZE);
  });

  it("counts pages from the full result set", () => {
    expect(paginate(items, "1").pageCount).toBe(Math.ceil(50 / PAGE_SIZE));
    expect(paginate(items, "1").total).toBe(50);
  });

  it("cuts the requested page out of the middle", () => {
    const slice = paginate(items, "2");
    expect(slice.items[0]).toBe(PAGE_SIZE);
    expect(slice.from).toBe(PAGE_SIZE + 1);
  });

  it("returns the last page when the request overshoots", () => {
    // A stale bookmark must not render an empty grid.
    const slice = paginate(items, "999");
    expect(slice.page).toBe(slice.pageCount);
    expect(slice.items.length).toBeGreaterThan(0);
  });

  it("falls back to the first page for junk input", () => {
    expect(paginate(items, "0").page).toBe(1);
    expect(paginate(items, "-3").page).toBe(1);
    expect(paginate(items, "abc").page).toBe(1);
  });

  it("reads the first value of a repeated query parameter", () => {
    expect(paginate(items, ["2", "5"]).page).toBe(2);
  });

  it("reports one empty page for an empty catalogue", () => {
    const slice = paginate([], undefined);
    expect(slice.pageCount).toBe(1);
    expect(slice.from).toBe(0);
    expect(slice.to).toBe(0);
  });
});
