// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Navbar from "./Navbar";
import { CartProvider } from "../context/CartContext";
import { useBusinessCart } from "../../lib/business-cart";

const navigationState = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  navigationState.pathname = "/";
});

function BusinessCartAdder() {
  const cart = useBusinessCart();
  return <button type="button" onClick={() => cart.addLine({ productId: "at-799", quantity: 2 })}>הוסף עסקי</button>;
}

it("gives business customers a clear direct link to their portal", () => {
  render(
    <CartProvider>
      <Navbar />
    </CartProvider>,
  );

  expect(screen.getByRole("link", { name: "לקוחות עסקיים" }).getAttribute("href")).toBe("/business");
});

it("keeps the business ordering route reachable from the mobile header", () => {
  render(
    <CartProvider>
      <Navbar />
    </CartProvider>,
  );

  expect(screen.getByRole("link", { name: "לקוחות עסקיים: מחירי יבואן והזמנה ישירה" }).getAttribute("href")).toBe("/business");
});

it("shows the separate business cart in the header and keeps its item count in sync", async () => {
  navigationState.pathname = "/business/catalog";

  render(
    <CartProvider>
      <Navbar />
      <BusinessCartAdder />
    </CartProvider>,
  );

  expect((await screen.findByRole("link", { name: "לסל העסקי, 0 פריטים" })).getAttribute("href")).toBe("/business/cart");

  fireEvent.click(screen.getByRole("button", { name: "הוסף עסקי" }));

  expect(await screen.findByRole("link", { name: "לסל העסקי, 2 פריטים" })).toBeTruthy();
});

it("shows the VAT-inclusive approved total beside the business cart", async () => {
  navigationState.pathname = "/business/checkout";
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ items: [{ productId: "at-799", grossUnitPrice: 177 }] }),
  }));

  render(
    <CartProvider>
      <Navbar />
      <BusinessCartAdder />
    </CartProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "הוסף עסקי" }));

  expect(await screen.findByText("₪354.00")).toBeTruthy();
});
