import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CartPageLoading,
  ComparisonLoading,
  ProductPageLoading,
  WishlistLoading,
} from "./loading-states";

describe("loading states", () => {
  it.each([
    { LoadingState: ProductPageLoading, name: "product", label: "Produkt wird geladen…" },
    { LoadingState: WishlistLoading, name: "wishlist", label: "Merkliste wird geladen…" },
    { LoadingState: ComparisonLoading, name: "comparison", label: "Vergleich wird geladen…" },
    { LoadingState: CartPageLoading, name: "cart", label: "Warenkorb wird geladen…" },
  ])("announces the $name loader accessibly", ({ LoadingState, label }) => {
    const { container } = render(<LoadingState />);

    expect(screen.getByRole("status")).toHaveTextContent(label);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});
