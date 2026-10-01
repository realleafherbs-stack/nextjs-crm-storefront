// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import Footer from "./Footer";

afterEach(cleanup);

it("gives business customers a clearly named footer link to their portal", () => {
  render(<Footer />);

  expect(screen.getByRole("link", { name: "לקוחות עסקיים" }).getAttribute("href")).toBe("/business");
});
