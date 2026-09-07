# FEEZEE Fashion — architecture and decisions

The record of how this shop is built and, where it matters, why it is built that
way rather than the obvious alternative. Read this before changing anything in
`src/modules/` — most of what looks like an odd choice below is load-bearing.

---

## 1. What this is

A production e-commerce site for **FEEZEE SILAI FASHION L.L.C**, a womenswear
boutique in Madina Mall, Dubai. It began as a pixel-faithful showcase of a
Claude Design file; it is now a shop that takes money, holds stock and runs its
own back office.

| | |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 over the design tokens in `src/styles/tokens.css` |
| Database | PostgreSQL 16, via Prisma 7 with the `@prisma/adapter-pg` driver adapter |
| Auth | JWT in an httpOnly cookie (`jose`), passwords bcrypt cost 12 |
| Validation | Zod 4, shared between the browser and the server |
| Payments | Stripe (cards + Apple Pay), Cash on Delivery, UAE bank transfer |
| Email | Resend, with a console transport as the development fallback |

Design is unchanged. The palette (`--fz-cream`, `--fz-ink`, `--fz-gold`,
`--fz-wine`…), the typography (Marcellus display, Jost body) and every
responsive rule are the ones the showcase shipped with. Two tokens were added
for the admin, which sits on ink rather than cream: `--fz-wine-bright` and
`--fz-gold-light`.

---

## 2. Getting it running

```bash
cp .env.example .env          # then set SESSION_SECRET
docker compose up -d          # PostgreSQL 16 on :5432
npm install
npx prisma db push            # create the schema
npm run db:seed               # migrate the catalogue in
npm run dev
```

Default administrator: **admin@feezee.ae** / **FeezeeAdmin2026!** — change it
before this is on a real domain.

### Credentials checklist

| Variable | Needed for | Without it |
| --- | --- | --- |
| `DATABASE_URL` | everything | the app will not start |
| `SESSION_SECRET` | sign-in, admin | sign-in throws; must be ≥ 32 chars |
| `NEXT_PUBLIC_SITE_URL` | metadata, emails, Stripe returns | defaults to `localhost:3000` |
| `STRIPE_SECRET_KEY` | card / Apple Pay | the card option is not offered at all |
| `STRIPE_WEBHOOK_SECRET` | marking card orders paid | the webhook returns 400 |
| `BANK_TRANSFER_IBAN` | bank transfer option | the option is not offered |
| `RESEND_API_KEY` | real email | emails are printed to the server console |
| `NEXT_PUBLIC_ASSET_BASE` | serving `public/` from a CDN | assets served from the app |

A missing optional key never breaks a page — the feature it powers is withdrawn
cleanly. See `availablePaymentOptions()` and the notifications transport.

---

## 3. The shape of the code

```
prisma/
  schema.prisma          16 models. Money is Decimal(10,2), never a float.
  seed.ts                One-way door: content files → database rows.
prisma.config.ts         Prisma 7 config; the CLI's connection URL lives here.

src/modules/             The business. No JSX, no routing.
  shared/                money.ts (Decimal ↔ number), settings, store-policy
  catalogue/             DB-backed reads that return the design's Product shape
  inventory/             Concurrency-safe stock + the adjustment ledger
  checkout/              UAE validation, VAT, delivery — isomorphic
  payments/              One interface, three providers, Stripe webhook verify
  orders/                Order numbers, placement, state machine, cancellation
  shipping/              UAE couriers and their tracking URLs
  customers/             Register, sign in, reset, address book (+ session.ts)
  returns/               Eligibility, requests, admin resolution, restock
  reporting/             Metrics, series, top sellers, CSV
  notifications/         Pluggable transport + branded HTML emails
  admin/                 RBAC guards and the audit log

src/app/
  actions/               Server actions: cart, checkout, account, admin
  (storefront)           /, /new-in, /sale, /product/[slug], /cart, /checkout, …
  account/               Customer portal — 9 routes
  admin/                 Back office — 12 routes, ink and champagne
  api/webhooks/stripe/   The only thing that may mark a card order paid
```

**The rule:** a page decides what to show. A module decides what is true. If a
page contains a business rule, it is in the wrong place.

---

## 4. Decisions that matter

### 4.1 The shop cannot oversell — and this is how

Two customers pressing *Place order* on the last size L in the same second is
ordinary on a drop day. The naive implementation — read the stock, check it,
write the new value — loses that race every time, because both reads happen
before either write.

`deductStock` never reads before writing. It issues a **conditional update**:

```sql
UPDATE "ProductVariant" SET stock = stock - $1 WHERE id = $2 AND stock >= $1
```

Postgres locks the row for the statement. The second transaction blocks,
re-evaluates `stock >= n` against the *new* value, and matches **zero rows**.
Zero rows updated is the oversell, caught. `OutOfStockError` then rolls the
whole order back with it.

Whole baskets go through `deductMany`, which sorts by variant id first: two
baskets holding the same two garments in opposite orders would otherwise each
hold the row the other is waiting for. A consistent lock order makes that
deadlock impossible.

Every movement writes a `StockAdjustment` **inside the same transaction**, with
the balance it produced, so the ledger and the count can never disagree.

Verified: two concurrent `placeOrder` calls for a variant with stock 1 → one
order, one `OutOfStockError`, final stock 0, and no row left behind by the
loser.

### 4.2 The browser never sends a price

A basket arriving from a client is a list of `{ variantId, quantity }` and
nothing else. Unit prices, VAT and delivery are read or computed on the server
in `priceBasket` and `placeOrder`. A tampered request can change *what* someone
buys; it can never change *what they pay*.

The cart in `localStorage` does carry a display snapshot (name, image, price) so
the drawer draws instantly rather than after a round trip — but that snapshot is
for pixels only, and `priceBag` corrects it as soon as the server answers.

### 4.3 Money is Decimal in the database, integer fils in arithmetic

5% VAT on an odd subtotal is exactly where binary floating point starts losing
fils, and an invoice whose lines do not sum to its total is a support ticket.
Columns are `Decimal(10,2)`; all arithmetic happens in whole fils
(`src/modules/shared/money.ts`); the boundary converts to plain `number` so no
Prisma `Decimal` is ever handed to a client component — that throws at render
time, which is the worst place to discover it.

**VAT is charged on goods plus delivery.** UAE VAT treats the courier charge as
part of the consideration, so a 25 AED delivery carries its own 1.25 AED. The
*free-delivery threshold*, though, is tested against the subtotal before VAT —
"free delivery over AED 1,000" is a promise about the price of the clothes.

### 4.4 Payment is started outside the order transaction

`placeOrder` writes the order and takes the stock in one interactive
transaction, then returns. Only afterwards is the payment provider called. A
card sheet is a network round trip to another company, and holding row locks
across one is how a slow Stripe response becomes a shop that cannot sell
anything.

Consequence: an order exists in `PENDING` before it is paid. That is correct —
it is also what lets Cash on Delivery and bank transfer be first-class rather
than special cases.

### 4.5 Only the signed webhook marks a card order paid

Stripe appends `?paid=1` when it sends the customer back. The confirmation page
ignores it. `POST /api/webhooks/stripe` verifies a timing-safe HMAC-SHA256 over
`timestamp.rawBody` with a five-minute replay window, is idempotent (Stripe
retries; an order already `PAID` is acknowledged and ignored), and answers a bad
signature with **400** — a 5xx would have Stripe retry a forgery for days.

The raw body is read with `request.text()`. Parsing and re-serialising the JSON
changes the bytes and the signature will never match.

### 4.6 Order numbers come from a Postgres sequence

`FZ-26-1001`, from `nextval('feezee_order_number')`. `nextval` is
non-transactional, so two checkouts in the same instant get two different
numbers without blocking or retrying. The cost is a gap in the run when an order
rolls back — a missing number is an accounting curiosity, a duplicate one is an
incident.

### 4.7 The refund and the restock are separate decisions

A piece that comes back marked is still refunded as a matter of goodwill, but it
does not go back on the rail. Tying them together would either put damaged stock
up for sale or refuse a refund to protect the inventory count. `ReturnRequest`
carries `isRestocked` independently of `status`, and the restock only fires
while that flag is still false — so saving the form twice cannot restock the
same garment twice.

### 4.8 The admin guard re-reads the user

The session cookie is signed, so its `role` claim cannot be forged — but it was
minted when the person signed in. Someone demoted from ADMIN an hour ago would
otherwise keep admin rights until their token expired. `requireStaff` costs one
indexed lookup per admin page view and makes a revocation take effect at once.

Every server action re-checks the session independently. A server action is a
public HTTP endpoint; the fact that only the admin UI links to it protects
nothing.

### 4.9 Sign-in does not confirm which half was wrong

"No account with that email" tells an attacker which addresses are worth
guessing passwords for. Both cases return the same sentence, and `login` runs
bcrypt against a throwaway hash even when there is no such user — skipping it
would make "no account" measurably faster to answer, which is the same leak by
another route. The admin login additionally rejects CUSTOMER accounts *as if*
the password were wrong.

### 4.10 The session is not read in the header

Reading a cookie in the header would make every page that renders it dynamic,
costing the whole shop its static rendering for the sake of one icon. The
account icon therefore always links to `/account`, which redirects a guest to
sign-in itself. Product and collection pages stay ISR (`revalidate = 60`).

### 4.11 A grid tile cannot add to the bag

A size is now a SKU with its own stock. The old "Add to Bag" on a card would
have to pick a size on the customer's behalf. It is a "Select Size" link to the
garment's page instead. The wishlist keeps a bulk action, but it is labelled
"Add first available size to bag", because that is what it does.

### 4.12 Curation stays in `src/content/`, stock does not

`content/products.ts` and `content/product-detail.ts` were the source of truth
while this was a showcase. They are now **seed input** and the home of editorial
data that is not commerce: which lines New In gathers, the four looks in each
drop tab, the order the boutique rail hangs in, the journal, the Silai page, the
assistant's script, the size chart.

`src/modules/catalogue/collections.ts` resolves that curation against live rows
and drops anything archived. So an admin price change shows on the home page,
and an archived garment leaves every grid — without the design's editorial
judgement being retyped into a database table.

### 4.13 The back office is ink, the shop is cream

Not decoration. A glance at a laptop on the shop counter should say instantly
which of the two you are looking at, so that nobody edits a live price thinking
they are browsing.

---

## 5. Data model notes

- **`Order` flattens its shipping address.** It is where the parcel went, and it
  must not change when the customer later edits their address book.
- **`OrderItem` copies name, size, SKU, price and image.** An invoice reprinted
  next year shows what was actually sold, not what the catalogue says today.
- **`Address.userId` is nullable** so a guest checkout still produces one.
- **Transition timestamps are nullable on purpose** — the null *is* the
  information that the step has not happened.
- **`StockAdjustment.balanceAfter`** lets the ledger be replayed and reconciled
  against the variant.
- **`StoreSetting`** holds VAT rate, free-shipping threshold, courier fee and
  return window. The defaults in `store-policy.ts` are the contract; the table
  is an override, and a failed read falls back rather than failing a checkout.

Re-seeding is idempotent and deliberately asymmetric: catalogue copy is
overwritten so a corrected description propagates, but `stock` is only ever set
when a variant is first created. Re-seeding must never undo a morning of
counting on the shop floor.

---

## 6. Payment provider configuration

### Stripe
1. Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Add an endpoint at `https://<your-domain>/api/webhooks/stripe` subscribed to
   `checkout.session.completed`, `payment_intent.succeeded`,
   `payment_intent.payment_failed`, `charge.refunded`.
3. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
4. For Apple Pay, verify the domain in the Stripe dashboard — no code change;
   a Checkout Session offers it automatically on a supporting device.

Implemented against the REST API with `fetch` plus `node:crypto`, deliberately
without the SDK: two calls and one signature check are not worth a dependency
that brings its own HTTP stack into the server bundle. Swapping the SDK in means
replacing `src/modules/payments/stripe.ts` and nothing else.

### Cash on delivery
Always available. The order is `PENDING` until delivery, and
`updateFulfillment` marks a COD order `PAID` the moment it is delivered.

### Bank transfer
Set `BANK_TRANSFER_IBAN`, `_BANK_NAME`, `_ACCOUNT_NAME`. The IBAN is the one
number on this site that costs real money to get wrong, so it is environment
configuration rather than code. The confirmation page prints it with the order
number as the reference and a WhatsApp button for the receipt; staff mark it
paid from the order screen.

---

## 7. Tax and shipping policy

| Setting | Default | Where |
| --- | --- | --- |
| UAE VAT | 5% of goods + delivery | `vatRate` |
| Free delivery | subtotal ≥ AED 1,000 | `freeShippingThresholdAed` |
| Standard courier | AED 25 | `standardShippingFeeAed` |
| Return window | 7 days **from delivery** | `returnWindowDays` |

The window runs from the delivery date, not the order date — a parcel that took
a week to arrive has not eaten a week of the customer's seven days.

Couriers (`src/modules/shipping/`): Aramex, Emirates Post, Fetchr, DHL Express,
FEEZEE Local Courier. Each owns its own tracking-URL shape, so adding one is a
single entry rather than a new `if` in three templates.

---

## 8. Verified behaviour

`npm run build` and `npm run lint` both pass clean. Beyond that, the following
were exercised against a live database:

- VAT, delivery and totals, including that lines always sum to the total and
  that 33.33 × 3 leaves no floating-point dust.
- **The oversell race**: two concurrent orders for a variant with one in stock →
  exactly one order, stock 0 (never negative), ledger correct, no orphan row.
- Order transitions, including that dispatch without a courier is refused, that
  COD is marked paid on delivery, and that a delivered order cannot go
  backwards.
- Returns: eligibility, a second open return refused, refund, restock, and that
  restocking twice is impossible.
- Cancellation restoring stock.
- Reporting metrics, AOV consistency, and CSV export (UTF-8 BOM for Excel).
- Route guards: `/account/*` and `/admin/*` redirect to their sign-in; the CSV
  export answers 401; the Stripe webhook answers 400 without a valid signature.

---

## 9. Known gaps

- **No automated test suite.** The verification above was a script run against a
  live database, not something CI can repeat. A Vitest suite over
  `src/modules/` is the obvious next step.
- **No image upload.** The product editor takes filenames already in
  `public/img/`. Real uploads need a blob store.
- **Refunds are recorded, not executed.** Marking a return refunded updates the
  order and the ledger; moving the money back through Stripe is still manual.
- **`npm audit` reports 4 highs**, all inside the `prisma` CLI devDependency
  (`@prisma/config` → `deepmerge-ts`, and `mysql2`, which this project does not
  use). Nothing ships to the runtime bundle. `npm audit fix --force` would
  install the Prisma 8 release candidate, which is worse.
- **Guest orders have no lookup page.** A guest can reach their confirmation by
  order number from the email, but cannot list past orders without an account.
- **Copy still says Pakistan in places.** The business is UAE-registered and the
  currency is AED, but `values.ts`, the Silai testimonials and FAQ, and parts of
  the assistant script still describe Pakistani delivery and cash-on-delivery
  terms. Heritage positioning is fine; the operational claims are not.
