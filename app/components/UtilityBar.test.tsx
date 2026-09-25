// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import UtilityBar from "./UtilityBar";

it("keeps the shipping offer permanently visible and links to delivery details", () => {
  render(<UtilityBar />);

  const shippingOffer = screen.getByRole("link", { name: "משלוח ב־₪39 · משלוח חינם בקנייה מעל ₪299" });
  expect(shippingOffer.getAttribute("href")).toBe("/shipping");
});
