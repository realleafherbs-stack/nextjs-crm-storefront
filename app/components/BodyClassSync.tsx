"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { getBodyClassForPath } from "../../lib/bodyClass";

// Every class getBodyClassForPath can ever return, so a route change can
// remove exactly these without touching classes other code owns on body
// (e.g. AccessibilityWidget's "no-scroll" while its dialog is open).
const ALL_PAGE_CLASSES = ["compare-page", "compare-page--refined", "shop-page", "product-template"];

// middleware.ts + layout.tsx set the right <body> class server-side for a
// hard load, but the root layout never re-renders on <Link> navigation
// (App Router keeps it mounted across routes), so body's class would stay
// stuck on whatever the previous page needed. This mirrors the same
// pathname → class mapping on the client and re-applies it on every route
// change. useLayoutEffect (not useEffect) so it runs before paint — no
// visible flash of the wrong page's styling.
export default function BodyClassSync() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    document.body.classList.remove(...ALL_PAGE_CLASSES);
    const next = getBodyClassForPath(pathname);
    if (next) document.body.classList.add(...next.split(" "));
  }, [pathname]);

  return null;
}
