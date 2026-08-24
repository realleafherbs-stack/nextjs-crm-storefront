// Single source of truth for which <body> class each route needs, per the
// ported CSS's page-scoped selectors (e.g. .product-template has 279
// rules). Shared by middleware.ts (SSR, avoids flash-of-wrong-styling on a
// hard load) and BodyClassSync.tsx (client-side, keeps it correct across
// <Link> navigations, which never re-run the root layout server-side).
export function getBodyClassForPath(pathname: string): string {
  if (pathname === "/compare") return "compare-page compare-page--refined";
  if (pathname === "/shop") return "shop-page";
  if (pathname.startsWith("/shop/")) return "product-template";
  return "";
}
