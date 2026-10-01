# HTC B2B Business Commerce Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure, CRM-approved HTC wholesale storefront at `/business`, with group-specific product prices, business orders and a secure HYP payment confirmation path.

**Architecture:** Ducks CRM owns B2B applications, accounts, invitations, product terms and business orders. The HTC storefront owns the branded, same-origin UX and exposes thin server routes that verify a signed HttpOnly session before calling Ducks with its private site key. Retail and B2B carts, pricing, checkout intents and orders stay separate. HYP redirects first to a server route that validates its `Sign` data with HYP before any order is finalized.

**Tech Stack:** Next.js 16 / React 19 / TypeScript / Vitest; Prisma/PostgreSQL in B2BCRM; HYP hosted payment page; Nodemailer; existing Ducks site API.

**Spec:** `docs/superpowers/specs/2026-09-27-htc-b2b-business-commerce-design.md`

## Global Constraints

- Scope every B2B record and API operation to the `htc-israel` site.
- Keep business prices, stock checks and totals server-side; never expose the Ducks API key, raw activation/reset token or customer price list to a guest.
- Use separate B2B cart storage, session cookie, checkout intent and order channel; do not mutate `htc-israel-cart-v2` or retail order records.
- Invitation tokens are random, hashed at rest, single-use and expire after 72 hours; reset tokens have the same properties and rate-limited public responses do not enumerate accounts.
- B2B product prices are exact net ILS values by CRM price group; VAT and gross values are calculated/snapshotted at checkout. No B2B coupon field or hard-coded percentage discount.
- All B2B screens are Hebrew/RTL, accessible, and have no horizontal overflow or trapped scroll at 320–430 px or a 13-inch desktop browser at 100%.
- An HYP payment may become `paid` only after server-side `APISign What=VERIFY` returns `CCode=0` and its `Order` and `Amount` match the staged checkout. Never finalize from a browser-supplied order id.
- Do not put passwords, API keys, raw tokens, PII or customer-specific prices into browser analytics or logs.

## Review Focus

- An expired, reused or superseded activation/reset token must not create a session or alter a password (Task 2 tests).
- Changing a business, product, quantity, price or price-group id in browser requests must not expose data or alter a final total (Tasks 2 and 8 tests).
- A blocked account or a changed password must invalidate a previously issued B2B session at the next protected request (Tasks 2 and 5 tests).
- A HYP success URL with a forged `Order`, `Amount`, `CCode` or signature must not create an order, invoice or email (Task 4 tests).
- A stale B2B cart line whose product becomes inactive, out of stock or has a new minimum/order increment must be corrected/rejected before payment (Tasks 7 and 8 tests).

---

## File structure

### B2BCRM

- `prisma/schema.prisma` — site-scoped business records, price groups, terms, invitations and B2B orders.
- `lib/business/types.ts` — API payloads and serializable business-catalog/order types.
- `lib/business/security.ts` — token hashing, constant-time comparison and password/token validation helpers.
- `lib/business/service.ts` — authorization, price calculation and business-order staging/finalization services.
- `lib/business/*.test.ts` — unit tests for token, session, price and order rules.
- `app/api/[siteSlug]/b2b/**/route.ts` — site-key-protected private B2B service endpoints consumed only by HTC server routes.
- `app/(crm)/sites/[siteId]/business/page.tsx` and `components/business/*` — staff application, access, price group and B2B order controls.
- `app/actions/business.ts` — authenticated CRM staff operations.

### HTC storefront

- `lib/business-crm.ts` — typed Ducks B2B client used only by server code.
- `lib/business-session.ts` — signed, short-lived B2B session cookie and `requireBusinessSession` helper.
- `lib/business-cart.ts` — client B2B cart containing product ids/quantities only, under its own storage key.
- `app/api/business/**/route.ts` — same-origin application/auth/session/catalog/cart/checkout proxy routes.
- `app/business/**` — public landing, application, sign-in/activation/reset, catalogue, cart, checkout and account pages.
- `app/components/Business*` — compact shared B2B UI pieces.
- `app/api/hyp-return/route.ts`, `lib/hyp.ts` and payment pages — verified HYP return before retail or B2B order finalization.
- `app/globals.css` — RTL/mobile/desktop B2B styles using the existing HTC custom CSS design system.

## Task 1: Model B2B commerce in Ducks CRM

**Files:**
- Modify: `B2BCRM/prisma/schema.prisma`
- Create: `B2BCRM/lib/business/types.ts`
- Create: `B2BCRM/lib/business/security.ts`
- Test: `B2BCRM/lib/business/security.test.ts`

**Interfaces:**
- Produces `BusinessApplication`, `BusinessAccount`, `BusinessMember`, `BusinessPriceGroup`, `BusinessProductTerm`, `BusinessInvitation`, `BusinessOrder` and `BusinessOrderItem` Prisma models, all related to `Site`.
- Produces `hashOpaqueToken(token: string): string`, `newOpaqueToken(): string`, `isStrongBusinessPassword(password: string): boolean`, and `assertBusinessTerm(term, quantity): BusinessTermError | null`.

- [ ] **Step 1: Write failing token and quantity-rule tests**

```ts
import { expect, it } from 'vitest'
import { hashOpaqueToken, isStrongBusinessPassword, assertBusinessTerm } from './security'

it('hashes a raw invitation token without preserving it', () => {
  expect(hashOpaqueToken('secret-token')).not.toContain('secret-token')
})

it('rejects a quantity below the minimum or outside the increment', () => {
  expect(assertBusinessTerm({ minQuantity: 6, quantityIncrement: 3 }, 7)?.code).toBe('INVALID_QUANTITY')
})
```

- [ ] **Step 2: Run the new unit test and confirm it fails**

Run: `pnpm test lib/business/security.test.ts`

Expected: FAIL because the business security module does not exist.

- [ ] **Step 3: Add the Prisma relations and minimal pure helpers**

```prisma
model BusinessPriceGroup {
  id String @id @default(cuid())
  siteId String
  name String
  active Boolean @default(true)
  site Site @relation(fields: [siteId], references: [id], onDelete: Cascade)
  accounts BusinessAccount[]
  terms BusinessProductTerm[]
  @@unique([siteId, name])
}

model BusinessProductTerm {
  id String @id @default(cuid())
  priceGroupId String
  productId String
  netUnitPrice Float
  minQuantity Int @default(1)
  quantityIncrement Int @default(1)
  active Boolean @default(true)
  priceGroup BusinessPriceGroup @relation(fields: [priceGroupId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@unique([priceGroupId, productId])
}
```

Use `crypto.randomBytes(32).toString('base64url')` for opaque tokens and SHA-256 for stored token hashes. Add the remaining application/account/member/invitation/order models named above, site indexes, a `sessionVersion` integer on `BusinessMember`, and line snapshots for net/VAT/gross values.

- [ ] **Step 4: Generate Prisma and run tests**

Run: `pnpm exec prisma generate && pnpm test lib/business/security.test.ts`

Expected: PASS.

- [ ] **Step 5: Create a non-destructive migration and commit**

Run: `pnpm exec prisma migrate dev --name add_business_commerce --create-only && git add prisma lib/business && git commit -m "feat(crm): add B2B commerce data model"`

Expected: an additive migration containing new business tables and indexes only; inspect it before applying it to any shared database.

## Task 2: Implement CRM B2B policy, credentials and private site API

**Files:**
- Create: `B2BCRM/lib/business/service.ts`
- Create: `B2BCRM/lib/business/service.test.ts`
- Create: `B2BCRM/app/api/[siteSlug]/b2b/applications/route.ts`
- Create: `B2BCRM/app/api/[siteSlug]/b2b/auth/login/route.ts`
- Create: `B2BCRM/app/api/[siteSlug]/b2b/auth/activate/route.ts`
- Create: `B2BCRM/app/api/[siteSlug]/b2b/auth/password-reset/route.ts`
- Create: `B2BCRM/app/api/[siteSlug]/b2b/auth/session/route.ts`
- Create: `B2BCRM/app/api/[siteSlug]/b2b/catalog/route.ts`
- Create: `B2BCRM/app/api/[siteSlug]/b2b/orders/route.ts`

**Interfaces:**
- Consumes the models/helpers from Task 1 and `x-api-key` site authentication already used by checkout-intent routes.
- Produces `authenticateBusinessMember(siteId, email, password)`, `activateBusinessMember(token, password)`, `getBusinessSession(subject)`, `getCatalogForMember(subject)`, `quoteBusinessOrder(subject, lines, delivery)` and `submitBusinessApplication(input)`.

- [ ] **Step 1: Write failing policy tests with an in-memory Prisma seam**

```ts
it('returns no catalogue terms for a member whose business is blocked', async () => {
  await expect(getCatalogForMember(blockedSubject)).rejects.toMatchObject({ code: 'BUSINESS_INACTIVE' })
})

it('uses the current CRM term rather than a browser-provided price', async () => {
  const quote = await quoteBusinessOrder(activeSubject, [{ productId: 'p1', quantity: 2, clientPrice: 1 }], delivery)
  expect(quote.items[0].netUnitPrice).toBe(84)
})
```

- [ ] **Step 2: Run the policy test and confirm it fails**

Run: `pnpm test lib/business/service.test.ts`

Expected: FAIL because the service functions do not exist.

- [ ] **Step 3: Implement the service and routes with strict response shapes**

```ts
type BusinessSubject = { memberId: string; businessId: string; sessionVersion: number }

type BusinessCatalogItem = {
  productId: string; handle: string; name: string; image: string | null; imageAlt: string | null
  sku: string | null; stock: number | null; minQuantity: number; quantityIncrement: number
  netUnitPrice: number; vatRate: number; grossUnitPrice: number
}

export async function quoteBusinessOrder(subject: BusinessSubject, lines: Array<{ productId: string; quantity: number }>, delivery: DeliveryInput): Promise<BusinessQuote>
```

Every endpoint first resolves the site from `siteSlug`, validates `x-api-key`, then validates the supplied `BusinessSubject` against account status and `sessionVersion`. `catalog` returns prices only after that validation. `applications` accepts only normalized required fields and creates `PENDING`; it never returns an account-existence signal. `login`, `activate` and reset endpoints normalize email and return a generic failure for bad credentials/tokens.

- [ ] **Step 4: Run policy tests and route-level tests**

Run: `pnpm test lib/business/service.test.ts && pnpm test`

Expected: PASS. Add route tests for 401 without the site key, 403 for a blocked subject, 400 for an invalid quantity, and an empty guest catalogue response.

- [ ] **Step 5: Commit the private API boundary**

Run: `git add lib/business app/api/'[siteSlug]'/b2b && git commit -m "feat(crm): add secure B2B site API"`

## Task 3: Add staff B2B operations to Ducks CRM

**Files:**
- Create: `B2BCRM/app/actions/business.ts`
- Create: `B2BCRM/app/(crm)/sites/[siteId]/business/page.tsx`
- Create: `B2BCRM/components/business/BusinessApplicationRow.tsx`
- Create: `B2BCRM/components/business/BusinessPriceGroupForm.tsx`
- Create: `B2BCRM/components/business/BusinessOrderRow.tsx`
- Modify: `B2BCRM/components/site-tabs.tsx`
- Test: `B2BCRM/app/actions/business.test.ts`

**Interfaces:**
- Consumes Task 2 services and staff `auth()`.
- Produces `approveBusinessApplication`, `rejectBusinessApplication`, `setBusinessStatus`, `upsertBusinessPriceTerm`, `issueBusinessInvitation` and `updateBusinessOrderStatus` server actions.

- [ ] **Step 1: Write failing staff-action authorization tests**

```ts
it('refuses an unauthenticated price change', async () => {
  await expect(upsertBusinessPriceTerm({ siteId: 's1', productId: 'p1', priceGroupId: 'g1', netUnitPrice: 84 })).rejects.toThrow('Unauthorized')
})

it('approval creates an account and emits a single-use invitation hash', async () => {
  const result = await approveBusinessApplication('application-1', 'group-1')
  expect(result.invitationUrl).toContain('/business/activate?token=')
})
```

- [ ] **Step 2: Run the staff-action test and confirm it fails**

Run: `pnpm test app/actions/business.test.ts`

Expected: FAIL because B2B staff actions do not exist.

- [ ] **Step 3: Implement staff controls and route entry**

```tsx
const sales: NavItem[] = [
  { label: '🛒 Orders', href: `${base}/orders` },
  { label: '🏢 Business', href: `${base}/business` },
  { label: '📬 Submissions', href: `${base}/submissions` },
]
```

Require CRM staff authentication in every action, scope all Prisma writes to `siteId`, audit application status/price term/invitation events, and show applications, approved accounts, price groups/terms and B2B orders in one clear tab. The invitation UI may copy/send only a generated URL; it must never display a password or saved raw token.

- [ ] **Step 4: Run tests and build the CRM**

Run: `pnpm test app/actions/business.test.ts && pnpm build`

Expected: PASS.

- [ ] **Step 5: Commit the staff interface**

Run: `git add app components && git commit -m "feat(crm): manage HTC business customers"`

## Task 4: Secure HYP payment finalization before adding B2B payment

**Files:**
- Create: `nextjs-crm-storefront/lib/hyp.ts`
- Create: `nextjs-crm-storefront/lib/hyp.test.ts`
- Create: `nextjs-crm-storefront/app/api/hyp-return/route.ts`
- Modify: `nextjs-crm-storefront/app/api/hyp-checkout/route.ts`
- Modify: `nextjs-crm-storefront/app/payment/success/page.tsx`
- Modify: `nextjs-crm-storefront/app/payment/success/SuccessClient.tsx`
- Modify: `nextjs-crm-storefront/app/api/confirm-order/route.ts`
- Modify: `B2BCRM/app/api/[siteSlug]/checkout-intents/[id]/finalize/route.ts`

**Interfaces:**
- Produces `verifyHypReturn(search: URLSearchParams, expected: { orderId: string; amount: number }): Promise<VerifiedHypPayment>`.
- Consumes a staged checkout intent and `finalizeOrder(orderId, verifiedPayment)` where verified payment contains HYP transaction id, approval code and amount.

- [ ] **Step 1: Write failing HYP verification tests**

```ts
it('does not accept a forged success redirect', async () => {
  mockHypVerify('CCode=902')
  await expect(verifyHypReturn(new URLSearchParams('Order=HT-1&Amount=99&CCode=0&Sign=forged'), { orderId: 'HT-1', amount: 99 })).rejects.toMatchObject({ code: 'INVALID_PAYMENT' })
})

it('rejects a signed transaction when its amount differs from the staged amount', async () => {
  mockHypVerify('CCode=0')
  await expect(verifyHypReturn(validReturn, { orderId: 'HT-1', amount: 199 })).rejects.toMatchObject({ code: 'AMOUNT_MISMATCH' })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `pnpm test lib/hyp.test.ts`

Expected: FAIL because no verified HYP return implementation exists.

- [ ] **Step 3: Implement the server-only return flow**

```ts
const verifyParams = new URLSearchParams({ action: 'APISign', What: 'VERIFY', Masof, KEY: key, PassP: passP })
for (const [key, value] of returnParams.entries()) verifyParams.append(key, value)
const response = await fetch(`https://pay.hyp.co.il/p/?${verifyParams.toString()}`, { cache: 'no-store' })
```

Set HYP `SuccessUrl` to `/api/hyp-return`. The GET route preserves the received query parameter order, reads the staged intent's expected total, validates `Order`, `Amount`, redirect `CCode`, and HYP's `APISign/VERIFY` `CCode=0`, then calls CRM finalization once. It sets an HttpOnly, short-lived receipt cookie and redirects to `/payment/success`; the success page only renders a verified receipt and never finalizes an order. Remove the client `/api/confirm-order` fallback or make it return 410. Persist only transaction id/approval code/amount needed for audit, never card data.

- [ ] **Step 4: Run security tests, existing payment tests and build**

Run: `pnpm test lib/hyp.test.ts && pnpm test && CI=true pnpm build`

Expected: PASS; every forged or mismatched callback leaves the checkout intent unfinalized.

- [ ] **Step 5: Commit the shared payment fix**

Run: `git add lib app && git commit -m "fix: verify HYP payment before order finalization"`

## Task 5: Add the HTC B2B server boundary and signed session

**Files:**
- Create: `nextjs-crm-storefront/lib/business-crm.ts`
- Create: `nextjs-crm-storefront/lib/business-session.ts`
- Create: `nextjs-crm-storefront/lib/business-session.test.ts`
- Create: `nextjs-crm-storefront/app/api/business/apply/route.ts`
- Create: `nextjs-crm-storefront/app/api/business/login/route.ts`
- Create: `nextjs-crm-storefront/app/api/business/logout/route.ts`
- Create: `nextjs-crm-storefront/app/api/business/activate/route.ts`
- Create: `nextjs-crm-storefront/app/api/business/password-reset/route.ts`
- Create: `nextjs-crm-storefront/app/api/business/catalog/route.ts`
- Create: `nextjs-crm-storefront/app/api/business/session/route.ts`

**Interfaces:**
- Consumes Task 2's private API and `B2B_SESSION_SECRET` (server environment only).
- Produces `createBusinessSession(subject)`, `readBusinessSession()`, `requireBusinessSession()` and a `BusinessCrmClient` that always attaches the site API key server-side.

- [ ] **Step 1: Write failing session tests**

```ts
it('rejects a tampered session signature', async () => {
  await expect(readBusinessSession('valid.payload.signature-tampered')).resolves.toBeNull()
})

it('invalidates a session when CRM reports a changed session version', async () => {
  await expect(requireBusinessSession({ crm: sessionVersionChangedCrm })).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
})
```

- [ ] **Step 2: Run the session test and confirm it fails**

Run: `pnpm test lib/business-session.test.ts`

Expected: FAIL because business session helpers do not exist.

- [ ] **Step 3: Implement signed sessions and proxy routes**

```ts
type BusinessSessionSubject = { memberId: string; businessId: string; sessionVersion: number; expiresAt: number }
```

Sign a base64url payload with HMAC-SHA-256, verify with `timingSafeEqual`, and set it only as `HttpOnly; Secure; SameSite=Lax; Path=/business`. Every protected route calls CRM `auth/session` to check current status/version before returning catalogue, account or order data. Public `/api/business/apply` validates input locally and then calls the private CRM endpoint; it never exposes the CRM URL/key to the browser.

- [ ] **Step 4: Run tests and build**

Run: `pnpm test lib/business-session.test.ts && pnpm test && CI=true pnpm build`

Expected: PASS.

- [ ] **Step 5: Commit the storefront security boundary**

Run: `git add lib app/api/business && git commit -m "feat: add HTC B2B session and CRM proxy"`

## Task 6: Build the public HTC business acquisition and access journey

**Files:**
- Create: `nextjs-crm-storefront/app/business/page.tsx`
- Create: `nextjs-crm-storefront/app/business/BusinessLandingClient.tsx`
- Create: `nextjs-crm-storefront/app/business/apply/page.tsx`
- Create: `nextjs-crm-storefront/app/business/login/page.tsx`
- Create: `nextjs-crm-storefront/app/business/activate/page.tsx`
- Create: `nextjs-crm-storefront/app/business/forgot-password/page.tsx`
- Create: `nextjs-crm-storefront/app/business/reset-password/page.tsx`
- Create: `nextjs-crm-storefront/app/business/business-access.test.tsx`
- Modify: `nextjs-crm-storefront/app/components/Navbar.tsx`
- Modify: `nextjs-crm-storefront/app/components/Footer.tsx`
- Modify: `nextjs-crm-storefront/app/globals.css`

**Interfaces:**
- Consumes Task 5 same-origin endpoints.
- Produces links to `/business`, accessible application/auth forms, and business-specific analytics events with no PII.

- [ ] **Step 1: Write failing access-journey tests**

```tsx
it('submits a valid business application and confirms manual review', async () => {
  render(<BusinessApplicationPage />)
  await user.type(screen.getByLabelText('שם העסק'), 'מספרת הדוגמה')
  await user.click(screen.getByRole('button', { name: 'שליחת בקשה' }))
  expect(await screen.findByText('הבקשה התקבלה')).toBeVisible()
})

it('does not reveal whether an email has a business account during reset', async () => {
  expect(await requestBusinessReset('unknown@example.com')).toEqual({ ok: true })
})
```

- [ ] **Step 2: Run the access-journey test and confirm it fails**

Run: `pnpm test app/business/business-access.test.tsx`

Expected: FAIL because the pages do not exist.

- [ ] **Step 3: Implement premium, compact RTL pages**

```tsx
<Link href="/business/apply" className="button button--gold">בקשה לחשבון עסקי</Link>
<Link href="/business/login" className="button button--ghost">כניסה ללקוחות עסקיים</Link>
```

Explain importer benefits, professional range, price-after-approval and the three approval steps. Ask only for the application fields in the spec. Use standard labels, input autocomplete, inline error summaries and loading/confirmation states. Do not expose wholesale prices before session validation.

- [ ] **Step 4: Run UI tests and responsive checks**

Run: `pnpm test app/business/business-access.test.tsx && CI=true pnpm build`

Expected: PASS. Manually inspect 390 px and 1366 px routes with no overlay, fixed bar or footer collision.

- [ ] **Step 5: Commit the public B2B entry flow**

Run: `git add app/business app/components app/globals.css && git commit -m "feat: add HTC business access journey"`

## Task 7: Build the protected catalogue and isolated B2B cart

**Files:**
- Create: `nextjs-crm-storefront/lib/business-cart.ts`
- Create: `nextjs-crm-storefront/lib/business-cart.test.ts`
- Create: `nextjs-crm-storefront/app/business/catalog/page.tsx`
- Create: `nextjs-crm-storefront/app/business/catalog/BusinessCatalogClient.tsx`
- Create: `nextjs-crm-storefront/app/business/cart/page.tsx`
- Create: `nextjs-crm-storefront/app/components/BusinessProductCard.tsx`
- Create: `nextjs-crm-storefront/app/components/BusinessCartSummary.tsx`
- Test: `nextjs-crm-storefront/app/business/catalog/BusinessCatalogClient.test.tsx`

**Interfaces:**
- Consumes `GET /api/business/catalog`, `BusinessCatalogItem` and Task 5 session enforcement.
- Produces `useBusinessCart()` with only `{ productId, quantity }[]` persisted under `htc-israel-b2b-cart-v1`.

- [ ] **Step 1: Write failing cart/catalog tests**

```tsx
it('keeps business cart data separate from the retail storage key', () => {
  addBusinessLine({ productId: 'p1', quantity: 2 })
  expect(localStorage.getItem('htc-israel-cart-v2')).toBeNull()
})

it('shows a guest price gate instead of a wholesale price', async () => {
  render(<BusinessCatalogClient catalog={guestCatalog} />)
  expect(screen.getByText('מחיר עסקי לאחר אישור')).toBeVisible()
})
```

- [ ] **Step 2: Run the catalogue/cart tests and confirm they fail**

Run: `pnpm test lib/business-cart.test.ts app/business/catalog/BusinessCatalogClient.test.tsx`

Expected: FAIL because no B2B cart/catalogue exists.

- [ ] **Step 3: Implement catalogue, product terms and cart behavior**

```ts
export type BusinessCartLine = { productId: string; quantity: number }
export const BUSINESS_CART_STORAGE_KEY = 'htc-israel-b2b-cart-v1'
```

Show only the current CRM-authorized catalogue to an approved session. Product cards include image, name, SKU, stock state, net price, VAT/gross price, minimum/increment, quantity control and line feedback. On guest catalogue rendering, omit price fields from data and show the price gate. On cart render, refetch/reconcile all current terms; remove unavailable lines with an explicit notice rather than displaying stale price data.

- [ ] **Step 4: Run tests, build and mobile smoke check**

Run: `pnpm test lib/business-cart.test.ts app/business/catalog/BusinessCatalogClient.test.tsx && CI=true pnpm build`

Expected: PASS. Verify 320, 390 and 1366 px with long Hebrew model names and a zero-stock item.

- [ ] **Step 5: Commit catalogue and cart isolation**

Run: `git add lib/business-cart.ts app/business app/components && git commit -m "feat: add protected HTC business catalogue"`

## Task 8: Build B2B checkout, order history and reorder

**Files:**
- Create: `nextjs-crm-storefront/app/api/business/checkout/route.ts`
- Create: `nextjs-crm-storefront/app/api/business/orders/route.ts`
- Create: `nextjs-crm-storefront/app/business/checkout/page.tsx`
- Create: `nextjs-crm-storefront/app/business/account/page.tsx`
- Create: `nextjs-crm-storefront/app/business/account/BusinessOrdersClient.tsx`
- Create: `nextjs-crm-storefront/app/business/checkout/BusinessCheckoutClient.test.tsx`
- Modify: `B2BCRM/lib/business/service.ts`
- Modify: `B2BCRM/app/api/[siteSlug]/b2b/orders/route.ts`
- Test: `B2BCRM/lib/business/service.test.ts`

**Interfaces:**
- Consumes `requireBusinessSession()`, B2B cart lines and Task 4 verified payment return.
- Produces `stageBusinessCheckout(subject, lines, delivery)`, `finalizeBusinessOrder(intentId, verifiedPayment)`, `listBusinessOrders(subject)` and `reorder(orderId)`.

- [ ] **Step 1: Write failing checkout and authorization tests**

```tsx
it('has no B2B coupon input and keeps the order summary above delivery fields on mobile', () => {
  render(<BusinessCheckoutPage />)
  expect(screen.queryByLabelText(/קופון/)).toBeNull()
  expect(screen.getByText('פירוט הזמנה').compareDocumentPosition(screen.getByLabelText('עיר'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
})

it('rejects a checkout whose browser quantity bypasses the CRM increment', async () => {
  await expect(stageBusinessCheckout(subject, [{ productId: 'p1', quantity: 7 }], delivery)).rejects.toMatchObject({ code: 'INVALID_QUANTITY' })
})
```

- [ ] **Step 2: Run checkout tests and confirm they fail**

Run: `pnpm test app/business/checkout/BusinessCheckoutClient.test.tsx && pnpm test lib/business/service.test.ts`

Expected: FAIL because the B2B checkout/order functions do not exist.

- [ ] **Step 3: Implement server-calculated B2B ordering**

```ts
const quote = await businessCrm.quoteBusinessOrder(subject, body.lines, body.delivery)
const orderId = `HTB-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
await businessCrm.stageBusinessCheckout(orderId, quote)
```

The store route ignores client price/name/stock. CRM recalculates every line from the account's current group term, validates delivery fields and returns the only payment amount. The HYP payment carries a `HTB-` order id; the verified HYP return selects the B2B finalizer by this prefix and sends owner/customer notifications with business context. Account history is scoped to the session's business; reorder loads editable quantities into only the B2B cart.

- [ ] **Step 4: Run critical tests and full builds**

Run: `pnpm test app/business/checkout/BusinessCheckoutClient.test.tsx && pnpm test && CI=true pnpm build` in both repositories.

Expected: PASS. Assert a business member cannot retrieve another business's order or finalize a cart after block/price change.

- [ ] **Step 5: Commit B2B transactions and account history**

Run: `git add app lib && git commit -m "feat: add HTC business checkout and history"` in each affected repository.

## Task 9: Add operational hardening, analytics and release verification

**Files:**
- Modify: `nextjs-crm-storefront/.env.local.example`
- Modify: `B2BCRM/.env.local.example` if present, otherwise `B2BCRM/README.md`
- Modify: `nextjs-crm-storefront/README.md`
- Create: `nextjs-crm-storefront/app/business/business-flow.test.tsx`
- Modify: `nextjs-crm-storefront/app/robots.ts`
- Modify: `nextjs-crm-storefront/app/sitemap.ts`

**Interfaces:**
- Documents `B2B_SESSION_SECRET`, controlled storefront public URL, migration/apply order and staff setup sequence.
- Produces no-store headers for protected B2B data and a public `/business` sitemap URL only; protected routes remain out of sitemap/indexing.

- [ ] **Step 1: Write the end-to-end protection test**

```tsx
it('keeps protected business pages out of public indexing and redirects a guest from checkout', async () => {
  expect(await getRobotsRules()).toContain('/business/account')
  expect(await requestBusinessCheckoutAsGuest()).toHaveProperty('status', 401)
})
```

- [ ] **Step 2: Run the release test and confirm it fails**

Run: `pnpm test app/business/business-flow.test.tsx`

Expected: FAIL until the protected route/robots behavior exists.

- [ ] **Step 3: Add no-store/indexing/analytics/documentation safeguards**

```ts
sendGTMEvent({ event: 'b2b_catalog_view', commerce_channel: 'b2b' })
```

Keep events free of PII and prices. Add `X-Robots-Tag: noindex, nofollow` and `Cache-Control: private, no-store` to protected B2B API/page responses. Document all required server variables, the CRM setup flow (create price group → terms → approve → issue invite), required additive migration and HYP terminal setting: verification signature enabled with `Sign=True`.

- [ ] **Step 4: Run full verification and inspect both breakpoints**

Run: `pnpm test && CI=true pnpm build && git diff --check` in `B2BCRM`, then `pnpm test && CI=true pnpm build && git diff --check` in `nextjs-crm-storefront`.

Expected: all tests/builds pass with no whitespace errors. On staging, test guest, pending, approved, blocked, expired invitation, password reset, stale cart, forged HYP return and a successful HYP test transaction.

- [ ] **Step 5: Commit, create review and deploy in dependency order**

Run: `git add .env.local.example README.md app lib && git commit -m "docs: harden HTC B2B release"` in each repository. Deploy CRM schema/API/UI first, apply only the reviewed additive migration, configure storefront environment variables, deploy storefront second, and then run the staging checklist before production.

## Self-review

- **Spec coverage:** Tasks 1–3 cover CRM approval, price groups, access and staff operations; Tasks 5–8 cover the branded HTC experience, protected catalogue/cart/checkout/account/reorder; Task 4 closes the payment-verification prerequisite; Task 9 covers analytics, indexing, docs, responsive QA and release.
- **Placeholder scan:** No task defers behavior without a concrete route, type, function, validation or test command.
- **Type consistency:** `BusinessSubject`, `BusinessCatalogItem`, `BusinessCartLine`, `quoteBusinessOrder`, `stageBusinessCheckout` and `finalizeBusinessOrder` are defined before their consuming tasks.
- **Review focus coverage:** token lifecycle Task 2; authorization/pricing Task 2 and Task 8; session invalidation Task 5; forged payment Task 4; stale cart Task 7/8.

## Execution mode

The user explicitly instructed the work to continue through completion. Execute this plan natively in dependency order, preserving the task-level test/commit gates. Do not use subagents for this implementation.
