"use client";

import { useEffect } from "react";

const MOBILE_BREAKPOINT = 700;
const BOUNDARY_EPSILON = 1;
const SCROLLABLE_OVERFLOW = /^(auto|scroll|overlay)$/;

function elementFromTarget(target: EventTarget | null) {
  if (target instanceof Element) return target;
  if (target instanceof Node) return target.parentElement;
  return null;
}

function nestedScrollerCanMove(target: EventTarget | null, touchDeltaY: number) {
  let element = elementFromTarget(target);

  while (element && element !== document.body && element !== document.documentElement) {
    const style = window.getComputedStyle(element);
    const hasScrollableOverflow = SCROLLABLE_OVERFLOW.test(style.overflowY);

    if (hasScrollableOverflow && element.scrollHeight > element.clientHeight) {
      const canMoveTowardTop = touchDeltaY > 0 && element.scrollTop > BOUNDARY_EPSILON;
      const canMoveTowardBottom =
        touchDeltaY < 0 &&
        element.scrollTop + element.clientHeight < element.scrollHeight - BOUNDARY_EPSILON;

      if (canMoveTowardTop || canMoveTowardBottom) return true;
    }

    element = element.parentElement;
  }

  return false;
}

export default function MobileScrollBoundary() {
  useEffect(() => {
    let previousTouchY: number | null = null;

    const handleTouchStart = (event: TouchEvent) => {
      previousTouchY = event.touches.length === 1 ? event.touches[0].clientY : null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (window.innerWidth > MOBILE_BREAKPOINT || event.touches.length !== 1) return;

      const currentTouchY = event.touches[0].clientY;
      if (previousTouchY === null) {
        previousTouchY = currentTouchY;
        return;
      }

      const touchDeltaY = currentTouchY - previousTouchY;
      previousTouchY = currentTouchY;
      if (touchDeltaY === 0) return;

      const scrollingElement = document.scrollingElement ?? document.documentElement;
      const scrollTop = Math.max(window.scrollY, scrollingElement.scrollTop, document.body.scrollTop);
      const maxScrollTop = Math.max(0, scrollingElement.scrollHeight - window.innerHeight);
      const movingPastTop = scrollTop <= BOUNDARY_EPSILON && touchDeltaY > 0;
      const movingPastBottom = scrollTop >= maxScrollTop - BOUNDARY_EPSILON && touchDeltaY < 0;

      if (
        (movingPastTop || movingPastBottom) &&
        !nestedScrollerCanMove(event.target, touchDeltaY)
      ) {
        event.preventDefault();
      }
    };

    const resetTouch = () => {
      previousTouchY = null;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", resetTouch, { passive: true });
    document.addEventListener("touchcancel", resetTouch, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", resetTouch);
      document.removeEventListener("touchcancel", resetTouch);
    };
  }, []);

  return null;
}
