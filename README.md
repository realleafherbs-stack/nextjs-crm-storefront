# htc-israel

Next.js storefront for HTC ישראל (hair clippers/trimmers/shavers), integrated with B2BCRM.
Dev port: **3004**.

## Setup

1. In B2BCRM admin (`/admin/sites/new`), create a Site (slug `htc-israel`, revalidate URL
   `http://localhost:3004` in dev). Copy the generated `apiKey` and `revalidateSecret`.
2. In CRM admin, create 3 categories (`clipper`, `trimmer`, `shaver`) and add products matching
   `lib/products-data.ts`'s handles (`at-799`, `at-599`, `at-158`, `at-735`, `at-570`, `gt-667`) —
   or leave the CRM empty for now; the storefront falls back to the local static catalog.
3. `cp .env.local.example .env.local` and fill in `CRM_API_KEY`, `REVALIDATE_SECRET`, a unique
   server-only `B2B_SESSION_SECRET` (24+ characters), and `HYP_MASOF`/`HYP_KEY`/`HYP_PASSP`.
4. `npm install && npm run dev`

## Architecture notes

- No Tailwind — `app/globals.css` is a near-verbatim port of the original static site's custom
  CSS design system. Build UI against its existing class names, not new utility classes.
- Responsive UI work should follow the audience, brand, and accessibility principles documented
  in [`.impeccable.md`](./.impeccable.md).
- Product editorial content (specs, FAQ answers, "story" copy) and compare-at pricing live in
  `lib/product-content.ts`, not in CRM — see the design spec for why.
- Retail orders use the CheckoutIntent pattern (`lib/orders.ts`): nothing is written to the CRM as a
  real `Order` until Hyp Pay redirects back to the server verification route.
- B2B orders are separate `BusinessOrder` records. The storefront saves only product ids and quantities
  locally; the CRM resolves the approved account, active price group, stock, minimums, VAT and final amount.

## B2B setup and release order

1. Deploy the CRM schema/API first and apply the reviewed additive migrations in `B2BCRM/prisma/migrations` to staging before production.
2. In the CRM, create an active business price group, add a term for every sellable product (net ILS price, minimum and increment), then approve an application and issue its single-use invitation.
3. Set the CRM Site's `revalidateUrl` to the exact HTTPS storefront origin, configure the storefront's server-only `CRM_URL`, `CRM_SITE_SLUG`, `CRM_API_KEY`, `B2B_SESSION_SECRET`, HYP credentials and SMTP credentials, then deploy the storefront.
4. In the HYP terminal, enable signature verification for the `Sign=True` flow. The storefront validates the redirect with HYP `APISign What=VERIFY` before either a retail or business order is finalized.
5. Before production, exercise guest, pending, approved, blocked, expired invitation, reset-password, stale-cart, forged-return and successful HYP test-payment paths. Check the business price catalog and history on both a 320px mobile viewport and desktop.

## Go-live checklist

- [ ] HYP terminal signature verification confirmed for the production terminal (`Sign=True` + `What=VERIFY`)
- [ ] Site created in CRM; `apiKey` + `revalidateSecret` copied into the deploy's env vars
- [ ] `revalidateUrl` on the Site updated to the production storefront URL
- [ ] Vercel env vars set with production values (`CRM_URL=https://www.ducks.co.il`)
- [ ] No secret behind a `NEXT_PUBLIC_` prefix
- [ ] Real Hyp Pay terminal confirmed (polarizedx's, unless this site gets its own later)
- [ ] Products created/activated in CRM (or intentionally left on the static fallback)
