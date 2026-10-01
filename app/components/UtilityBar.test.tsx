// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import UtilityBar from "./UtilityBar";

afterEach(cleanup);

it("keeps only the free-shipping threshold visible and links to delivery details", () => {
  render(<UtilityBar />);

  const shippingOffer = screen.getByRole("link", {
    name: "משלוח חינם בקנייה מעל ₪249, לפרטי משלוחים",
  });
  expect(shippingOffer.getAttribute("href")).toBe("/shipping");
});

it("repeats the shipping promise visually while announcing it only once", () => {
  render(<UtilityBar />);

  const shippingTicker = screen.getByRole("link", {
    name: "משלוח חינם בקנייה מעל ₪249, לפרטי משלוחים",
  });

  expect(shippingTicker.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  expect(screen.getAllByText("משלוח חינם בקנייה מעל ₪249")).toHaveLength(2);
});
