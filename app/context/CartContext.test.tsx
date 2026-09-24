// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CartProvider, useCart } from "./CartContext";

function CartPanelHarness() {
  const { openPanel, closePanel } = useCart();

  return (
    <>
      <button type="button" onClick={openPanel}>פתיחת סל</button>
      <button type="button" onClick={closePanel}>סגירת סל</button>
    </>
  );
}

describe("CartProvider panel state", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.className = "shop-page";
  });

  afterEach(() => {
    document.body.className = "";
  });

  it("locks background scrolling only while the cart drawer is open", async () => {
    const user = userEvent.setup();
    const view = render(
      <CartProvider>
        <CartPanelHarness />
      </CartProvider>,
    );

    await user.click(screen.getByRole("button", { name: "פתיחת סל" }));
    expect(document.body.classList.contains("no-scroll")).toBe(true);

    await user.click(screen.getByRole("button", { name: "סגירת סל" }));
    expect(document.body.classList.contains("no-scroll")).toBe(false);

    view.unmount();
    expect(document.body.classList.contains("no-scroll")).toBe(false);
  });
});
