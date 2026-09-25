import { afterEach, describe, expect, it, vi } from "vitest";
import { getProducts } from "./products";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getProducts", () => {
  it("keeps curated local imagery for known products while using live CRM commerce data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        id: "crm-at-570",
        handle: "at-570",
        name: "HTC Trio from CRM",
        price: 149,
        image: "https://app.payper.co.il/slow-primary.jpg",
        images: [
          "https://app.payper.co.il/slow-primary.jpg",
          "https://app.payper.co.il/slow-gallery.jpg",
        ],
        payperSku: "6971864100592",
        stockQuantity: 7,
      }],
    }));

    const [product] = await getProducts();

    expect(product).toMatchObject({
      id: "crm-at-570",
      name: "HTC Trio from CRM",
      price: 149,
      stock: 7,
      image: "/assets/products/at-570-single-v2.webp",
      images: [
        "/assets/products/at-570-single-v2.webp",
        "/assets/barbershop/at-570-action.jpg",
      ],
    });
  });
});
