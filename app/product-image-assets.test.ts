import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

describe("optimized product image assets", () => {
  it.each(["at-158", "at-735", "at-570", "gt-667"])(
    "keeps the optical scale rule for %s WebP",
    (handle) => {
      expect(css).toContain(`img[src$="${handle}-single-v2.webp"]`);
    },
  );
});
