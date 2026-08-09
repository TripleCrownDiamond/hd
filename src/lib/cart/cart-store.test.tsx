import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CartProvider, useCart } from "./cart-store";

const ITEM = {
  id: "wood-1",
  slug: "buche-palette",
  href: "/produkt/buche-palette",
  name: "Buchenholz Palette",
  quantity: 1,
  priceCents: 12900,
  imageKind: "wood" as const,
};

function Harness() {
  const cart = useCart();
  return (
    <>
      <output aria-label="count">{cart.count}</output>
      <output aria-label="subtotal">{cart.subtotalCents}</output>
      <output aria-label="open">{String(cart.isOpen)}</output>
      <button type="button" onClick={() => cart.add(ITEM)}>add</button>
      <button type="button" onClick={() => cart.setQuantity(ITEM.id, 3)}>quantity</button>
      <button type="button" onClick={() => cart.remove(ITEM.id)}>remove</button>
    </>
  );
}

describe("CartProvider", () => {
  beforeEach(() => window.localStorage.clear());

  it("adds, aggregates, updates and removes a cart line", async () => {
    render(<CartProvider><Harness /></CartProvider>);

    fireEvent.click(screen.getByText("add"));
    expect(screen.getByLabelText("count")).toHaveTextContent("1");
    expect(screen.getByLabelText("subtotal")).toHaveTextContent("12900");
    expect(screen.getByLabelText("open")).toHaveTextContent("true");

    fireEvent.click(screen.getByText("add"));
    expect(screen.getByLabelText("count")).toHaveTextContent("2");

    fireEvent.click(screen.getByText("quantity"));
    expect(screen.getByLabelText("count")).toHaveTextContent("3");
    expect(screen.getByLabelText("subtotal")).toHaveTextContent("38700");

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem("holzkraft:cart") ?? "[]")).toHaveLength(1);
    });

    fireEvent.click(screen.getByText("remove"));
    expect(screen.getByLabelText("count")).toHaveTextContent("0");
  });

  it("hydrates a persisted cart", async () => {
    window.localStorage.setItem("holzkraft:cart", JSON.stringify([{ ...ITEM, quantity: 2 }]));
    render(<CartProvider><Harness /></CartProvider>);

    await waitFor(() => expect(screen.getByLabelText("count")).toHaveTextContent("2"));
    expect(screen.getByLabelText("subtotal")).toHaveTextContent("25800");
  });
});
