// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import CartToast from "./CartToast";
import { CartProvider, useCart } from "../context/CartContext";

const PRODUCT_NAME = "HTC One Pro - מכונת תספורת מקצועית עם מסך LCD";

function AddToCartHarness() {
  const { addItem } = useCart();

  return (
    <>
      <button
        type="button"
        onClick={() => addItem({ id: "htc-one-pro", name: PRODUCT_NAME, price: 199 })}
      >
        הוספה לסל
      </button>
      <CartToast />
    </>
  );
}

describe("CartToast", () => {
  it("shows a compact, product-independent confirmation with an accessible cart action", async () => {
    const user = userEvent.setup();

    render(
      <CartProvider>
        <AddToCartHarness />
      </CartProvider>,
    );

    await user.click(screen.getByRole("button", { name: "הוספה לסל" }));

    const toast = screen.getByRole("status");
    expect(toast.getAttribute("aria-live")).toBe("polite");
    expect(toast.classList.contains("cart-toast")).toBe(true);
    expect(toast.classList.contains("is-visible")).toBe(true);
    expect(toast.textContent).toContain("המוצר נוסף לסל");
    expect(toast.textContent).not.toContain(PRODUCT_NAME);

    await user.click(screen.getByRole("button", { name: "לצפייה בסל" }));
    expect(screen.queryByRole("status")).toBeNull();
  });
});
