import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

describe("homepage hero responsive layout", () => {
  it("gives desktop copy a shrinkable column and a bounded fluid headline", () => {
    expect(css).toMatch(/\.hero__grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,48%\)\s+minmax\(0,52%\)[^}]*\}/s);
    expect(css).toMatch(/\.hero__copy\s*\{[^}]*min-width:\s*0[^}]*\}/s);
    expect(css).toMatch(/\.hero h1\s*\{[^}]*max-width:\s*100%[^}]*font-size:\s*clamp\(44px,4vw,60px\)[^}]*overflow-wrap:\s*break-word[^}]*\}/s);
  });

  it("keeps the centered tablet layout capped while explicitly anchoring desktop copy", () => {
    expect(css).toMatch(/@media\(max-width:900px\)\s*\{[\s\S]*?\.hero__copy\s*\{[^}]*max-width:\s*520px[^}]*text-align:\s*center[^}]*\}/s);
    expect(css).toMatch(/@media\(min-width:901px\)\s*\{\.hero__copy\s*\{[^}]*width:\s*100%[^}]*max-width:\s*100%[^}]*justify-self:\s*start[^}]*\}\}/s);
  });
});
