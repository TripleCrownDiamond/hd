import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CartProvider, useCart } from "@/lib/cart/cart-store";
import { ShortlistProvider, useShortlists } from "@/lib/shortlists/shortlist-store";
import { ProductActions } from "./product-actions";

const PRODUCT = {
  id: "wood-1",
  slug: "buche-palette",
  name: "Buchenholz Palette",
  brand: "Holzkraft",
  type: "wood" as const,
  priceCents: 12900,
  reviewStatus: "approved",
};

function State() {
  const cart = useCart();
  const shortlists = useShortlists();
  return (
    <>
      <output aria-label="cart count">{cart.count}</output>
      <output aria-label="cart open">{String(cart.isOpen)}</output>
      <output aria-label="wishlist count">{shortlists.wishlist.length}</output>
    </>
  );
}

function renderActions(reviewStatus = "approved") {
  return render(
    <CartProvider>
      <ShortlistProvider>
        <ProductActions product={{ ...PRODUCT, reviewStatus }} />
        <State />
      </ShortlistProvider>
    </CartProvider>,
  );
}

describe("ProductActions", () => {
  beforeEach(() => window.localStorage.clear());

  it("adds an approved, priced product to the cart and opens it", () => {
    renderActions();

    fireEvent.click(screen.getByRole("button", { name: "In den Warenkorb" }));

    expect(screen.getByLabelText("cart count")).toHaveTextContent("1");
    expect(screen.getByLabelText("cart open")).toHaveTextContent("true");
  });

  it("keeps an unapproved product out of the cart while allowing wishlist use", async () => {
    renderActions("pending");

    expect(screen.getByRole("button", { name: "In den Warenkorb" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Zur Merkliste hinzufügen/ }));

    expect(screen.getByLabelText("wishlist count")).toHaveTextContent("1");
    await waitFor(() =>
      expect(window.localStorage.getItem("holzkraft:wishlist")).toContain("buche-palette"),
    );
  });
});
