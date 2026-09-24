# htc-israel

Next.js storefront for HTC ישראל (hair clippers/trimmers/shavers), integrated with B2BCRM.
Dev port: **3004**.

## Setup

1. In B2BCRM admin (`/admin/sites/new`), create a Site (slug `htc-israel`, revalidate URL
   `http://localhost:3004` in dev). Copy the generated `apiKey` and `revalidateSecret`.
2. In CRM admin, create 3 categories (`clipper`, `trimmer`, `shaver`) and add products matching
   `lib/products-data.ts`'s handles (`at-799`, `at-599`, `at-158`, `at-735`, `at-570`, `gt-667`) —
   or leave the CRM empty for now; the storefront falls back to the local static catalog.
3. `cp .env.local.example .env.local` and fill in `CRM_API_KEY`, `REVALIDATE_SECRET`, and
   `HYP_MASOF`/`HYP_KEY`/`HYP_PASSP` (reused from polarizedx — same merchant account).
4. `npm install && npm run dev`

## Architecture notes

- No Tailwind — `app/globals.css` is a near-verbatim port of the original static site's custom
  CSS design system. Build UI against its existing class names, not new utility classes.
- Responsive UI work should follow the audience, brand, and accessibility principles documented
  in [`.impeccable.md`](./.impeccable.md).
- Product editorial content (specs, FAQ answers, "story" copy) and compare-at pricing live in
  `lib/product-content.ts`, not in CRM — see the design spec for why.
- Orders use the CheckoutIntent pattern (`lib/orders.ts`): nothing is written to the CRM as a
  real `Order` until Hyp Pay redirects the customer back to `/payment/success`.

## Known limitations

- **Payment verification gap**: neither `/api/confirm-order` nor `/payment/success`'s server-side finalize call verifies with Hyp Pay that a payment actually occurred before marking an order paid — both trust a client-supplied order id, which is not secret (it's echoed back in the Hyp payment URL before any payment happens). This mirrors xvape/polarizedx's existing reference pattern this project was built from, not a new mistake introduced here. **Do not go live with real money until this is fixed** — either a Hyp server-to-server IPN callback with signature verification, or a call to a Hyp transaction-lookup API before finalizing. See the `KNOWN LIMITATION` comments in `app/api/confirm-order/route.ts` and `app/payment/success/page.tsx` for the exact call sites.

## Go-live checklist

- [ ] **Payment verification implemented** (see "Known limitations" above) — do not go live without this
- [ ] Site created in CRM; `apiKey` + `revalidateSecret` copied into the deploy's env vars
- [ ] `revalidateUrl` on the Site updated to the production storefront URL
- [ ] Vercel env vars set with production values (`CRM_URL=https://www.ducks.co.il`)
- [ ] No secret behind a `NEXT_PUBLIC_` prefix
- [ ] Real Hyp Pay terminal confirmed (polarizedx's, unless this site gets its own later)
- [ ] Products created/activated in CRM (or intentionally left on the static fallback)
