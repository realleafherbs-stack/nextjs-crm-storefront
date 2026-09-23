import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

describe("mobile cart drawer layout", () => {
  it("sits above the sticky header and floating support controls", () => {
    expect(css).toMatch(/\.cart\s*\{[^}]*z-index:\s*300[^}]*\}/s);
    expect(css).toMatch(/\.scrim\s*\{[^}]*z-index:\s*290[^}]*\}/s);
  });

  it("keeps a short cart compact while allowing a long item list to scroll", () => {
    const marker = "/* Mobile cart drawer layout */";
    expect(css).toContain(marker);

    const mobileCartCss = css.slice(css.indexOf(marker));
    expect(mobileCartCss).toMatch(/@media\(max-width:560px\)\s*\{/s);
    expect(mobileCartCss).toMatch(/\.cart\s*\{[^}]*bottom:\s*auto[^}]*max-height:\s*100dvh[^}]*overflow:\s*hidden[^}]*\}/s);
    expect(mobileCartCss).toMatch(/\.cart__head\s*\{[^}]*flex:\s*none[^}]*\}/s);
    expect(mobileCartCss).toMatch(/\.cart__items\s*\{[^}]*flex:\s*0 1 auto[^}]*overflow-y:\s*auto[^}]*\}/s);
    expect(mobileCartCss).toMatch(/\.cart__foot\s*\{[^}]*flex:\s*none[^}]*\}/s);
  });
});
