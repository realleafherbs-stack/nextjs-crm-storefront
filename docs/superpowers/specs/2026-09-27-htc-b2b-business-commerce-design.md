# HTC Israel — B2B business commerce design

**Date:** 2026-09-27  
**Status:** proposed design — approved direction, awaiting review before implementation  
**References:** the iRealLeaf partner experience and the Polarized X business-commerce model

## Goal

Create a dedicated, protected wholesale experience for verified Israeli businesses that buy HTC hair clippers, trimmers and shavers directly from the importer. It must feel like HTC—not a generic admin dashboard—and must remain fully separate from the retail store.

The experience lets a salon, barber, retailer or distributor apply, be approved by HTC, activate a password-protected account, view its assigned business prices and place repeat orders. HTC staff manage applications, access, prices and orders from the existing Ducks CRM.

## Product principles

- **Approval before prices:** no visitor can see wholesale prices, add business-priced items, or submit a business order before HTC approves the business.
- **The CRM is authoritative:** approval status, access state, price group, product availability and orders live in Ducks; the storefront never treats a browser value as authoritative.
- **Retail and B2B do not bleed together:** separate session, cart, price calculation, checkout intent and order type. A retail cart never receives a business price, and a business cart never silently reverts to retail pricing.
- **Make repeat purchase fast:** approved buyers can find a model, see its SKU and stock, change a quantity, and reorder from their history without a sales call.
- **Hebrew, RTL, mobile first:** business owners commonly order from a phone in the shop. The UX remains compact and usable at 320–430 px, while desktop provides a faster catalogue/table view.
- **Premium but direct:** use HTC's black, ivory and muted-gold system; do not reproduce iRealLeaf or Polarized X branding, text or product rules.

## What we reuse from the references

### iRealLeaf

- A public partner proposition, then a catalogue where guests can understand the product range before asking for access.
- Product media, SKU, technical information and minimum-order context are visible; business prices are gated behind sign-in.
- An approved-customer path for account access, password reset, order history and a direct route back to the catalogue.

### Polarized X

- A CRM-driven approval lifecycle rather than a public discount code.
- A single-use, expiring access invitation that leads to password activation.
- Server-side validation of the authenticated business, product eligibility, quantity, price, availability, shipping and order totals.
- Separate business order records and operational controls.

HTC deliberately does **not** inherit the references' product-specific carton counts, fixed discounts, copy, design or payment rules. HTC commercial terms remain configurable by product and business group.

## Chosen architecture

Keep the experience on the existing HTTPS origin under `https://www.htcpro.co.il/business`. The current Next.js storefront supplies the branded UI and same-origin route handlers. Ducks CRM is extended with a site-scoped B2B commerce module for `htc-israel`.

This avoids a second public subdomain, avoids a generic external dashboard, and lets HTC continue to use its current product catalogue, CRM order view and deployment path.

### System boundary

| Layer | Responsibility |
| --- | --- |
| HTC storefront | Public business page, sign-in/activation/reset screens, protected catalogue, B2B cart, business account and order-history UX. Keeps an HttpOnly same-origin session cookie only. |
| HTC server routes | Validate request shape and session, proxy authenticated B2B requests to Ducks, never expose the CRM API key or raw wholesale data to a guest. |
| Ducks CRM B2B module | Stores applications, businesses, members, invitations, price groups, product terms, order intents and business orders; enforces status/pricing/stock rules. |
| Payment gateway | Receives only a server-calculated B2B checkout amount and a B2B order identifier. It never receives a browser-computed price. |

The implementation may reuse tested B2B primitives already present in the shared B2B platform—customer groups, price tiers, activation and business-order workflows—but it must be adapted behind the Ducks site API. The HTC frontend must not depend directly on another product's private deployment or database.

## Roles and lifecycle

| Role/state | Can do | Cannot do |
| --- | --- | --- |
| Visitor | Read the B2B proposition and product introductions; submit an application; sign in if already approved. | See wholesale prices, add to B2B cart or submit an order. |
| Applicant (pending) | Receive a clear confirmation and contact HTC. | Activate an account or access the B2B catalogue. |
| Approved business owner | Activate account, sign in, view its assigned prices/stock, order, reorder, edit permitted business details, reset password. | Change group prices, access another business, or pay with unapproved credit terms. |
| Blocked/expired business | See a neutral access-support message. | View prices or complete an order. |
| HTC staff | Review applications, set status and price group, set product availability/minimums, issue/revoke invitations, reset access, inspect B2B orders. | See or handle a customer password. |

### Approval and activation sequence

```text
Business applies on /business
  → Ducks creates a PENDING application and alerts HTC
  → Staff verifies the business and assigns a price group
  → Staff approves and issues a one-time invitation
  → Buyer opens invitation, verifies contact method if required, sets password
  → Account becomes ACTIVE and enters /business/catalog
  → Future sign-in or “forgot password” returns to the same business account
```

The activation link contains a high-entropy random token, is stored only as a hash, expires after 72 hours, is usable once, and is revoked when a newer link is issued or the business is blocked. HTC staff may send the link by the approved business email; a CRM action may also produce a copyable, time-limited link for a verified WhatsApp conversation. The raw token must never appear in CRM logs, analytics or an order note.

## Information model

All records are scoped to the `htc-israel` site. Exact field names may differ in implementation, but the capabilities below are mandatory.

### Business application

- Legal/business name, contact name, email, mobile number.
- Business type: salon, barber, retailer, distributor, other.
- City, optional business/tax identifier, optional website/social handle and note.
- Status: `PENDING`, `APPROVED`, `REJECTED`, `BLOCKED`.
- CRM audit fields: submitted, reviewed, reviewer, decision note and source/UTM when available.

### Business and membership

- One business profile with delivery/billing details and a status.
- In version 1, one owner/member is sufficient; the data model must allow additional members later without changing price ownership.
- The business—not the browser session—owns the price group and order history.

### Price groups and product terms

- A price group is assigned by HTC staff to a business, for example `SALON`, `RETAILER`, `DISTRIBUTOR`.
- A product can have a group-specific net unit price, active/inactive status, minimum quantity, order increment and optional maximum quantity.
- If no valid B2B price exists for the business/product, the item is unavailable to that business. It must not fall back to retail price or a global percentage discount.
- Currency is ILS. Catalogue and checkout display net price, VAT amount/rate and gross total clearly before payment. The order snapshots all values at purchase time.

### Business order

- Explicit order channel/type `B2B` and a link to the business and member.
- Immutable line snapshot: product id, name, SKU, quantity, net unit price, VAT, gross unit price and totals.
- Shipping method/fee and payment state, distinct from a generic retail order.
- CRM-visible status and staff notes; the member-facing history exposes only appropriate statuses and notes.

## Route and UX map

| Route | Visitor experience | Approved-business experience |
| --- | --- | --- |
| `/business` | Value proposition, product categories, how approval works, application CTA and sign-in. | Short welcome, “הזמנה עסקית” CTA, recent-order/reorder shortcut. |
| `/business/apply` | Compact, validated application form with a clear manual-review expectation. | Redirect to account/catalogue. |
| `/business/login` | Email + password; link to activation/help. | Sign in and redirect to intended protected route. |
| `/business/activate` | Validates invitation then accepts password and confirmation. | Not applicable after activation. |
| `/business/forgot-password` | Starts a rate-limited reset flow without revealing whether an email exists. | Same. |
| `/business/catalog` | Product introduction with prices masked and CTA to apply/sign in. | Search/filter, product cards/table, actual images, SKU, stock state, quantity controls and business prices. |
| `/business/cart` | Redirect to sign-in. | Separate B2B cart; price/stock rechecked on render and before checkout. |
| `/business/checkout` | Redirect to sign-in. | Minimal delivery/contact/payment flow; no coupon field and no retail cart distractions. |
| `/business/account` | Redirect to sign-in. | Business details, order history, reorder and access/security actions. |

### Catalogue and product experience

For an approved business the product surface contains:

- Correct, uncropped product image gallery and a route to the full HTC product explanation.
- Product name, category, actual SKU/makat, concise professional use case, key specification and availability state.
- Net unit price, VAT, gross unit price, quantity minimum/increment and a clear line subtotal.
- Search and practical category filters on desktop; touch-friendly product cards and an accessible sheet/drawer for filters on mobile.
- An "add" action with meaningful feedback, not a giant retail-style conversion banner.

Guests can understand the range but see "מחיר עסקי לאחר אישור" in the price location. This preserves lead value without exposing commercial terms.

### Checkout and ordering experience

- Show a compact expandable order summary above customer/delivery details on mobile; it opens by default only when an error requires attention.
- Do not show a coupon field in B2B checkout. The customer already has an approved commercial price.
- Keep primary payment action proportional to the total and separated from quantity controls; use clear shipping/tax breakdowns.
- Recheck on every sensitive server operation: active membership, business ownership, price group, product active state, permitted quantity, current stock and server-calculated totals.
- Reorder creates a new editable B2B cart; it never submits a duplicate order automatically.

## CRM operations

The HTC site area gains a Business customers section with these queues:

- **New applications:** review contact/business information; approve, reject or request clarification.
- **Approved customers:** assign/change price group, activate/block access, regenerate invitation, inspect order history.
- **Price groups:** set exact per-product business prices and product ordering rules. Changes are audited and take effect for future carts/orders only.
- **Business orders:** filter by order status, price group and business; view SKU, quantities, net/VAT/gross totals, delivery details and payment status.

Every approval, block, group change and invitation action is recorded with actor and timestamp. Passwords are never displayed, emailed or visible to staff.

## Security and privacy requirements

- Password hashes only, using the current supported password-hashing implementation; minimum length 8 and breach-resistant rate limiting on login/reset/activation.
- Session cookies are `HttpOnly`, `Secure`, `SameSite=Lax` or stricter, short-lived with server-side revocation on block/reset when feasible.
- Every CRM B2B endpoint scopes by site and authenticated business/member. IDs supplied by the browser are authorization inputs only after ownership checks.
- All invitation/reset tokens are random, single-use, hashed at rest and expire; response copy does not enumerate accounts.
- Rate-limit application, login, activation and reset routes; log security events without credentials or raw tokens.
- Separate B2B analytics events from retail events without sending price lists, customer details or tokens to ad platforms.
- Follow existing privacy/terms requirements and add a business-data purpose to the form notice.

## Payment and operational prerequisite

The current storefront README documents a payment-verification gap: its existing success flow can mark an order paid without a server-to-server confirmation from Hyp Pay. A B2B checkout must **not** be released for real money until that gap is fixed for both retail and B2B using a verified Hyp callback/IPN or a server-side transaction lookup.

The B2B payment flow will therefore be built behind the same verified-payment boundary. The business-order record is created as a checkout intent first; it becomes a paid/confirmed order only after verified payment confirmation. Credit terms, invoice-on-account and manual bank transfer are intentionally out of version 1.

## Analytics and success measures

Track only the steps needed to improve the business funnel:

- `b2b_apply_started`, `b2b_apply_submitted`, `b2b_application_approved`.
- `b2b_invitation_activated`, `b2b_login`, `b2b_catalog_view`, `b2b_add_to_cart`, `b2b_checkout_started`, `b2b_purchase`.
- Report applications-to-approval, approval-to-first-order, repeat-order rate, average B2B order value and top unpurchased catalogue views.

All events carry a non-sensitive B2B/retail channel marker; they must not carry email, phone, prices per customer or invitation tokens.

## Version 1 scope

Included:

- Branded `/business` landing, application, secure account activation/login/reset.
- CRM approval/block controls, customer price groups and configurable product pricing/minimums.
- Protected product catalogue, B2B cart, verified B2B checkout, CRM order display, history and reorder.
- Mobile and desktop QA, RTL/accessibility, tests and analytics funnel events.

Explicitly deferred:

- Automatic application approval or automatic credit allocation.
- Multiple buyer permissions, team purchasing rules and buyer approval chains.
- Quotes, saved lists, recurring orders, volume rebate calculations and ERP/distributor sync.
- Customer-visible invoices/credit limits and external sales-rep commissions.

## Acceptance criteria

1. A guest cannot retrieve wholesale price data from UI, route, API response or cart payload.
2. A pending or blocked business cannot create a B2B session, price a cart or check out.
3. A staff member can approve a valid application, set a price group and issue/revoke an activation link without handling a password.
4. An activated business sees only its valid product eligibility, prices, quantities and orders.
5. Browser-edited prices, quantities, product IDs or business IDs fail server-side; the final amount is calculated from CRM data.
6. Retail and B2B cart/session/order records remain distinct.
7. Mobile catalogue, cart and checkout have no horizontal overflow, no trapped scroll and no obscured primary action at 320–430 px; desktop remains stable at a 13-inch 100% browser viewport.
8. No paid B2B order can finalize before verified payment confirmation.
9. All new flows have automated coverage for authorization, token lifecycle, price validation and critical RTL/mobile states, plus manual live staging QA.

## Implementation dependencies and decisions already made

- **Chosen URL:** `/business` on the existing HTC domain.
- **Chosen commercial model:** staff-assigned CRM price groups with exact product prices; no universal customer-entered coupon and no hard-coded discount percentage.
- **Chosen access model:** manual approval, then secure invitation/password activation; reset password is available to an approved user.
- **Chosen order model:** direct B2B purchase with a separate order channel; payment must be verified server-side.
- **Still configurable in CRM:** group names, product price, eligibility, minimum quantity/increment, shipping terms and which products are orderable.

Before implementation, review this design once more for the commercial defaults (especially first price groups, minimum order quantities, and shipping terms). The subsequent implementation plan will map each approved section to a test-first change set and deployment sequence.
