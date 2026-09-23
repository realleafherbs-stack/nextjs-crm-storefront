import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

describe("product card price alignment", () => {
  it("reserves a consistent desktop intro row without adding empty mobile space", () => {
    const marker = "/* Product card price alignment */";
    expect(css).toContain(marker);

    const alignmentCss = css.slice(css.indexOf(marker));
    expect(alignmentCss).toMatch(/@media\(min-width:601px\)\s*\{[\s\S]*?\.product-card__intro\s*\{[^}]*min-height:\s*180px[^}]*\}/s);
    expect(alignmentCss).toMatch(/@media\(max-width:600px\)\s*\{[\s\S]*?\.product-card__intro\s*\{[^}]*min-height:\s*0[^}]*\}/s);
  });
});
