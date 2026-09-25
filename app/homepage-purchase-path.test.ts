import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const homePage = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

it("places the shop collection directly after the initial trust cues", () => {
  const benefits = homePage.indexOf('<section className="benefits"');
  const products = homePage.indexOf('<section className="products section" id="products">');
  const brandStory = homePage.indexOf('<section className="global-band"');

  expect(benefits).toBeGreaterThan(-1);
  expect(products).toBeGreaterThan(benefits);
  expect(products).toBeLessThan(brandStory);
});

it("turns the hero product photography into a direct product-page path", () => {
  expect(homePage).toMatch(/const heroProduct = products\.find\(\(p\) => p\.handle === "at-735"\) \?\? featured;/);
  expect(homePage).toMatch(/<Link className="hero__visual" href=\{`\/shop\/\$\{heroProduct\.handle\}`\} aria-label=\{`לצפייה ב־\$\{heroProduct\.name\}`\}\s*\/>/);
});
