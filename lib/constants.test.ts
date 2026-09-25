import { expect, it } from "vitest";

it("charges ₪39 shipping for an order below the free-shipping threshold", async () => {
  const constants = await import("./constants");
  const calculateShipping = constants.calculateShipping;

  expect(calculateShipping).toBeTypeOf("function");
  if (typeof calculateShipping !== "function") return;

  expect(calculateShipping(298.99)).toBe(39);
});

it("makes shipping free from ₪299 inclusive", async () => {
  const constants = await import("./constants");
  const calculateShipping = constants.calculateShipping;

  expect(calculateShipping).toBeTypeOf("function");
  if (typeof calculateShipping !== "function") return;

  expect(calculateShipping(299)).toBe(0);
});
