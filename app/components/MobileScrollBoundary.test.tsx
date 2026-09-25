// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MobileScrollBoundary from "./MobileScrollBoundary";

function touchEvent(type: string, clientY?: number | number[]) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "touches", {
    value:
      clientY === undefined
        ? []
        : (Array.isArray(clientY) ? clientY : [clientY]).map((value) => ({ clientY: value })),
  });
  return event;
}

describe("MobileScrollBoundary", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 2_000,
    });
    Object.defineProperty(document.documentElement, "scrollTop", {
      configurable: true,
      writable: true,
      value: 0,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("blocks outward touch movement at both document boundaries", () => {
    const addEventListener = vi.spyOn(document, "addEventListener");
    render(<MobileScrollBoundary />);

    expect(addEventListener).toHaveBeenCalledWith("touchmove", expect.any(Function), {
      passive: false,
    });

    document.body.dispatchEvent(touchEvent("touchstart", 300));
    const pastTop = touchEvent("touchmove", 360);
    document.body.dispatchEvent(pastTop);
    expect(pastTop.defaultPrevented).toBe(true);

    document.documentElement.scrollTop = 1_200;
    document.body.dispatchEvent(touchEvent("touchstart", 360));
    const pastBottom = touchEvent("touchmove", 300);
    document.body.dispatchEvent(pastBottom);
    expect(pastBottom.defaultPrevented).toBe(true);
  });

  it("blocks bottom overscroll when Safari's visual viewport is shorter than the root scroller", () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 720 });
    Object.defineProperty(document.documentElement, "clientHeight", {
      configurable: true,
      value: 800,
    });
    document.documentElement.scrollTop = 1_200;
    render(<MobileScrollBoundary />);

    document.body.dispatchEvent(touchEvent("touchstart", 360));
    const pastBottom = touchEvent("touchmove", 300);
    document.body.dispatchEvent(pastBottom);

    expect(pastBottom.defaultPrevented).toBe(true);
  });

  it("keeps normal page scrolling and nested scroll areas working", () => {
    render(<MobileScrollBoundary />);

    document.documentElement.scrollTop = 500;
    document.body.dispatchEvent(touchEvent("touchstart", 360));
    const insidePage = touchEvent("touchmove", 300);
    document.body.dispatchEvent(insidePage);
    expect(insidePage.defaultPrevented).toBe(false);

    document.documentElement.scrollTop = 1_200;
    const nested = document.createElement("div");
    nested.style.overflowY = "auto";
    Object.defineProperty(nested, "clientHeight", { configurable: true, value: 100 });
    Object.defineProperty(nested, "scrollHeight", { configurable: true, value: 300 });
    Object.defineProperty(nested, "scrollTop", {
      configurable: true,
      writable: true,
      value: 50,
    });
    document.body.appendChild(nested);

    nested.dispatchEvent(touchEvent("touchstart", 360));
    const insideNestedArea = touchEvent("touchmove", 300);
    nested.dispatchEvent(insideNestedArea);
    expect(insideNestedArea.defaultPrevented).toBe(false);

    nested.remove();
  });

  it("does not intercept the same boundary gesture above the mobile breakpoint", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1_024 });
    document.documentElement.scrollTop = 1_200;
    render(<MobileScrollBoundary />);

    document.body.dispatchEvent(touchEvent("touchstart", 360));
    const desktopGesture = touchEvent("touchmove", 300);
    document.body.dispatchEvent(desktopGesture);

    expect(desktopGesture.defaultPrevented).toBe(false);
  });

  it("ignores incomplete, stationary, and multi-touch gestures", () => {
    render(<MobileScrollBoundary />);

    const moveWithoutStart = touchEvent("touchmove", 300);
    document.body.dispatchEvent(moveWithoutStart);
    expect(moveWithoutStart.defaultPrevented).toBe(false);

    document.body.dispatchEvent(touchEvent("touchstart", 300));
    const stationaryMove = touchEvent("touchmove", 300);
    document.body.dispatchEvent(stationaryMove);
    expect(stationaryMove.defaultPrevented).toBe(false);

    document.body.dispatchEvent(touchEvent("touchstart", [300, 320]));
    const pinchMove = touchEvent("touchmove", [280, 340]);
    document.body.dispatchEvent(pinchMove);
    expect(pinchMove.defaultPrevented).toBe(false);
  });
});
