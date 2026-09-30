// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Navbar from "./Navbar";
import { CartProvider } from "../context/CartContext";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

afterEach(cleanup);

it("gives business customers a clear direct link to their portal", () => {
  render(
    <CartProvider>
      <Navbar />
    </CartProvider>,
  );

  expect(screen.getByRole("link", { name: "לקוחות עסקיים" }).getAttribute("href")).toBe("/business");
});
