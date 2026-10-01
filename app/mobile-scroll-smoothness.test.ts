import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf8");

describe("mobile scroll smoothness", () => {
  it("renders reveal targets immediately instead of animating them into a mobile scroll", () => {
    const mobileRules = css.slice(css.lastIndexOf("@media(max-width:700px)"));

    expect(mobileRules).toMatch(/\.reveal\s*\{[^}]*opacity:\s*1!important[^}]*transform:\s*none!important[^}]*transition:\s*none!important[^}]*\}/s);
  });
});
