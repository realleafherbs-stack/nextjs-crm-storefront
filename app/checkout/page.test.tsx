// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../components/Navbar", () => ({ default: () => null }));
vi.mock("../components/Footer", () => ({ default: () => null }));
vi.mock("../context/CartContext", () => ({
  FREE_SHIPPING_THRESHOLD: 299,
  useCart: () => ({
    items: [
      {
        id: "htc-glide",
        name: "HTC Glide - מגלח חשמלי עם 2 ראשי גילוח",
        price: 119,
        quantity: 1,
        stock: 12,
        image: "/products/glide.webp",
      },
    ],
    total: 119,
  }),
}));

import CheckoutPage from "./page";

describe("CheckoutPage order flow", () => {
  afterEach(() => cleanup());

  it("keeps a collapsed order summary above the customer details until requested", async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);

    const summaryLabel = screen.getByText("פירוט הזמנה");
    const details = summaryLabel.closest("details");
    const firstName = screen.getByLabelText("שם פרטי");

    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    expect(details?.compareDocumentPosition(firstName) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(summaryLabel);

    expect(details?.open).toBe(true);
    expect(screen.getByText(/HTC Glide - מגלח חשמלי עם 2 ראשי גילוח/)).not.toBeNull();
    expect(screen.getAllByText("₪148.00").length).toBeGreaterThan(0);
  });

  it("does not distract customers with coupon controls during checkout", () => {
    render(<CheckoutPage />);

    expect(screen.queryByPlaceholderText("קוד קופון")).toBeNull();
    expect(screen.queryByRole("button", { name: "החל" })).toBeNull();
  });
});
