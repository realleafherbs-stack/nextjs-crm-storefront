import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

describe("mobile product footer layout", () => {
  it("keeps the footer as the document boundary above the fixed buy bar", () => {
    expect(css).toMatch(/body\.product-template\s*\{[^}]*padding-bottom:\s*0[^}]*background:\s*#070706[^}]*\}/s);
    expect(css).toMatch(/html:has\(body\.product-template\)\s*\{[^}]*overscroll-behavior-y:\s*none[^}]*\}/s);
    expect(css).toMatch(/body\.product-template\s+\.footer\s*\{[^}]*padding-bottom:\s*calc\(94px\s*\+\s*env\(safe-area-inset-bottom\)\)[^}]*\}/s);
  });

  it("uses the full mobile footer width for the final service group", () => {
    expect(css).toMatch(/\.footer\s+\.footer__grid\s*>\s*div:last-child\s*\{[^}]*grid-column:\s*1\s*\/\s*-1[^}]*grid-template-columns:\s*repeat\(2,minmax\(0,1fr\)\)[^}]*\}/s);
  });
});
