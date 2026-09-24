// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import CookieConsent from "./CookieConsent";

describe("CookieConsent", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("exposes a clear primary, secondary, and preference action in the compact banner", async () => {
    render(<CookieConsent />);

    const accept = await screen.findByRole("button", { name: "קבל הכול" });
    const necessary = screen.getByRole("button", { name: "חיוניות בלבד" });
    const manage = screen.getByRole("button", { name: "ניהול העדפות" });

    expect(accept.getAttribute("data-cookie-action")).toBe("accept");
    expect(necessary.getAttribute("data-cookie-action")).toBe("necessary");
    expect(manage.getAttribute("data-cookie-action")).toBe("manage");
  });

  it("stores the privacy-first choice and leaves a clearly labelled compact preferences control", async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);

    await user.click(await screen.findByRole("button", { name: "חיוניות בלבד" }));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "אתם שולטים בעוגיות" })).toBeNull();
    });
    const preferences = screen.getByRole("button", { name: "פתיחת העדפות קוקיז" });
    expect(preferences.textContent).toContain("קוקיז");
    expect(JSON.parse(localStorage.getItem("htc-israel-cookie-consent-v1") || "null")).toEqual({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  });
});
