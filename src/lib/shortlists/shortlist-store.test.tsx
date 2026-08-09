import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { COMPARE_LIMIT, ShortlistProvider, useShortlists, type ShortlistEntry } from "./shortlist-store";

function entry(index: number): ShortlistEntry {
  return {
    slug: `stove-${index}`,
    name: `Ofen ${index}`,
    brand: "Testmarke",
    href: `/kaminofen/stove-${index}`,
    kind: "stove",
    comparison: {
      powerKwNominal: index,
      powerKwMin: null,
      powerKwMax: null,
      efficiencyPct: 80 + index,
      energyClass: "A+",
      fuel: "Scheitholz",
      heightMm: 1000,
      widthMm: 500,
      depthMm: 400,
      weightKg: 120,
      flueDiameterMm: 150,
    },
  };
}

function Harness() {
  const lists = useShortlists();
  return (
    <>
      <output aria-label="wishlist-count">{lists.wishlist.length}</output>
      <output aria-label="compare-count">{lists.compare.length}</output>
      <output aria-label="compare-full">{String(lists.compareIsFull)}</output>
      <button type="button" onClick={() => lists.toggle("wishlist", entry(1))}>wish</button>
      {Array.from({ length: COMPARE_LIMIT + 1 }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => lists.toggle("compare", entry(index + 1))}
        >
          compare-{index + 1}
        </button>
      ))}
    </>
  );
}

describe("ShortlistProvider", () => {
  beforeEach(() => window.localStorage.clear());

  it("toggles wishlist entries and persists them", async () => {
    render(<ShortlistProvider><Harness /></ShortlistProvider>);
    fireEvent.click(screen.getByText("wish"));
    expect(screen.getByLabelText("wishlist-count")).toHaveTextContent("1");

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem("holzkraft:wishlist") ?? "[]")).toHaveLength(1);
    });

    fireEvent.click(screen.getByText("wish"));
    expect(screen.getByLabelText("wishlist-count")).toHaveTextContent("0");
  });

  it("limits comparison to four products", () => {
    render(<ShortlistProvider><Harness /></ShortlistProvider>);
    for (let index = 1; index <= COMPARE_LIMIT + 1; index += 1) {
      fireEvent.click(screen.getByText(`compare-${index}`));
    }
    expect(screen.getByLabelText("compare-count")).toHaveTextContent(String(COMPARE_LIMIT));
    expect(screen.getByLabelText("compare-full")).toHaveTextContent("true");
  });

  it("hydrates persisted wishlist and comparison entries", async () => {
    window.localStorage.setItem("holzkraft:wishlist", JSON.stringify([entry(1)]));
    window.localStorage.setItem("holzkraft:compare", JSON.stringify([entry(2)]));
    render(<ShortlistProvider><Harness /></ShortlistProvider>);

    await waitFor(() => {
      expect(screen.getByLabelText("wishlist-count")).toHaveTextContent("1");
      expect(screen.getByLabelText("compare-count")).toHaveTextContent("1");
    });
  });
});
