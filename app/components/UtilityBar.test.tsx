// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import UtilityBar from "./UtilityBar";

it("keeps only the free-shipping threshold visible and links to delivery details", () => {
  render(<UtilityBar />);

  const shippingOffer = screen.getByRole("link", { name: "משלוח חינם בקנייה מעל ₪249" });
  expect(shippingOffer.getAttribute("href")).toBe("/shipping");
});
