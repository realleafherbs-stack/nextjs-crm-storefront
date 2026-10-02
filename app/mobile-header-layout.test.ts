import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

describe("mobile product header layout", () => {
  it("lets the header expand for the business ribbon instead of covering the breadcrumb", () => {
    const marker = "/* Product mobile checkout — compact hierarchy with full-size touch targets. */";
    const productMobileCss = css.slice(css.indexOf(marker));

    expect(productMobileCss).toMatch(/\.product-template \.site-header\s*\{[^}]*height:\s*auto[^}]*\}/s);
  });
});
