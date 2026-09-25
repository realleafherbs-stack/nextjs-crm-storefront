import { describe, expect, it } from "vitest";
import { products } from "./products-data";

describe("product gallery sources", () => {
  it.each(products)("keeps %s focused on the exact product and a real-use image", (product) => {
    expect(product.images).toHaveLength(2);
    expect(product.images[0]).toBe(product.image);
    expect(product.images[1]).toContain("/assets/barbershop/");
    expect(product.images[1]).toContain("-action");
    expect(product.images.some((image) => image.includes("-barbershop"))).toBe(false);
  });
});
