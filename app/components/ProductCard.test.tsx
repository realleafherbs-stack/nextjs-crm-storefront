// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { CartProvider } from "../context/CartContext";
import ProductCard from "./ProductCard";

vi.mock("@next/third-parties/google", () => ({ sendGTMEvent: vi.fn() }));

const product = {
  id: "at-799",
  handle: "at-799",
  name: "HTC One Pro",
  price: 349,
  image: "/assets/products/at-799-single.jpg",
  images: ["/assets/products/at-799-single.jpg"],
  cardFeatures: ["9,000 סל״ד", "להב DLC"],
  category: { id: "cat-clipper", name: "מכונות תספורת", slug: "clipper" },
  categoryOrder: 1,
  gtin: "6971864102077",
  stock: 1,
};

it("makes the product image a direct, labelled path to its product page", () => {
  render(
    <CartProvider>
      <ProductCard product={product} />
    </CartProvider>,
  );

  const imageLink = screen.getByRole("link", { name: "לצפייה ב־HTC One Pro" });
  expect(imageLink.getAttribute("href")).toBe("/shop/at-799");
  expect(imageLink.querySelector("img")).not.toBeNull();
});
