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

  it("keeps the quantity control visually compact and separated from the item price", () => {
    const marker = "/* Compact cart quantity control */";
    expect(css).toContain(marker);

    const compactControlCss = css.slice(css.indexOf(marker));
    expect(compactControlCss).toMatch(/\.cart-item__content>small\s*\{[^}]*display:\s*block[^}]*margin-top:\s*8px[^}]*\}/s);
    expect(compactControlCss).toMatch(/\.cart-item__quantity\s*\{[^}]*grid-template-columns:\s*36px 24px 36px[^}]*height:\s*36px[^}]*margin-top:\s*16px[^}]*\}/s);
    expect(compactControlCss).toMatch(/\.cart-item__quantity button\s*\{[^}]*width:\s*44px[^}]*height:\s*44px[^}]*margin:\s*-4px[^}]*\}/s);
  });
});
