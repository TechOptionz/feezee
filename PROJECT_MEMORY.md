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

### 4.6 An order number is a sequence and a secret

`FZ-26-1001-K7QM`. Two halves, doing two different jobs.

The **sequence** is the shop's own count, from `nextval('feezee_order_number')`.
`nextval` is non-transactional, so two checkouts in the same instant get two
different numbers without blocking or retrying. The cost is a gap in the run
when an order rolls back — a missing number is an accounting curiosity, a
duplicate one is an incident.

The **suffix** is four characters from `crypto.randomBytes`, and it is what
makes the number safe to be a credential. Tracking asks for the order number
and nothing else (4.16), so a purely sequential number would let anyone who has
bought once walk up and down the run reading other people's orders. Knowing
`FZ-26-1005-K7QM` now tells you nothing at all about `FZ-26-1006-…`.

Three details in `orderSuffix()` that are not decoration:

- The alphabet is `ABCDEFGHJKMNPQRSTUVWXYZ23456789` — no `I`, `L`, `O`, `0` or
  `1`, because this number is read down a phone line and copied off a printed
  receipt.
- Bytes of 248 and up are discarded rather than taken modulo 31 (31 × 8 = 248),
  or the first few letters of the alphabet would come up measurably more often.
- The byte pool is **refilled**, not drawn once. A fixed buffer runs dry on the
  rare draw that rejects enough bytes, and reading past its end yields
  `undefined` — which appends the word itself to the order number. It happens
  about twice in three hundred thousand: twice in production, and never once
  while you are watching.

Numbers issued before this — the plain `FZ-26-1004` shape — stay valid
everywhere, and are **not** renumbered: doing so would invalidate every number
already printed on a receipt or sitting in an inbox. They are still guessable
from one another, so tracking asks for the email alongside them, exactly as it
did before (4.16). The check narrows to nothing as those orders age out.

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
the password were wrong, and the shop's own form now rejects staff accounts —
though not silently, and 4.19 is why.

### 4.10 The session is not read in the header

Reading a cookie in the header would make every page that renders it dynamic,
costing the whole shop its static rendering for the sake of one icon. The
account icon therefore always links to `/account`, which redirects a guest to
sign-in itself. Product and collection pages stay ISR (`revalidate = 60`).

The browser store does need to know *which account* it is holding a bag for, and
the rule above is what makes that awkward — see 4.14 for how it is answered
without any server-side cookie read. `/wishlist` is still statically rendered
after that change; the build output is the check.

### 4.10b Stock changes are pushed to the shop, not waited for

Product pages are ISR on a 60-second window, which is right for copy and price
but wrong for stock: a size restocked on the shop floor should be buyable now,
and a size that has just gone should stop being offered now.

So all three admin paths that move stock — a recount, a cancellation, and a
return that restocks — call `revalidateStorefrontFor()` with the variants they
touched, which resolves them to product slugs and rebuilds those pages. The
return case is guarded on `isRestocked` having *just* flipped, so re-saving a
settled return does not rebuild anything.

Customer orders deliberately do **not** push. Every checkout invalidating a
product page would rebuild the whole catalogue on a busy morning, and the
60-second window is the right trade there.

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

### 4.14 A wishlist belongs to the account; a bag belongs to the browser

Both used to live in `localStorage` under one fixed key each, which meant one
browser had one wishlist no matter who was signed into it. A customer and an
administrator sharing the shop laptop saw each other's saved pieces, and the
same customer on a phone saw none of them.

They are split by what they are. **Saved pieces are a statement about taste**,
they should follow the person, and they now live in `WishlistItem` — read and
written through `src/modules/wishlist/`, never touched by the browser directly.
**A bag is about a purchase in progress**, it is fine for it to be local, and it
stays in `localStorage` — but under a key of its own per account, so two people
on one machine no longer share it.

Both need the page to know who is signed in, and 4.10 forbids the cookie read
that would answer it. So `createSession` sets a *second* cookie,
`feezee_scope`, deliberately not httpOnly: an HMAC of the user id under
`SESSION_SECRET`, which is stable per user, reveals no id and is worthless as a
credential. **Nothing trusts it.** Every wishlist action re-reads the real
session, in the same spirit as 4.8; forging it renames a `localStorage` key in
your own browser and grants nothing. It is cleared with the session on sign-out,
so a guest never inherits the previous customer's bag.

Signing in merges rather than replaces, in both directions. A guest's hearts are
folded into the account on the first sync and only then dropped from the
browser; a guest's bag moves to the account's key — and *only* on the
guest-to-account transition, never account-to-account, or an administrator
signing in after a customer would inherit their bag.

The consequence for the UI is `wishReady`, which is not the same as `hydrated`:
a signed-in wishlist is a round trip away, and `hydrated` alone would say
"ready" while the answer was still an empty guest list — long enough to print
"Nothing saved yet." over a wishlist that is not empty.

### 4.15 Staff get a door back to the back office, from a cookie

The admin sidebar has always carried "View the shop ↗"; the shop had no way
back, so staff typed `/admin`. The header cannot answer "is this person staff?"
without a server-side cookie read, and 4.10 forbids that — it would make every
page that draws the header dynamic.

So sign-in sets a *third* readable cookie, `feezee_staff`, on the same pattern
as 4.14 and with the same disclaimer: it carries no identity, only the fact
that a dashboard link is worth drawing, and **nothing trusts it.** `/admin` is
guarded by `requireStaff`, which re-reads the user from the database (4.8), so
forging the cookie earns a link to the admin sign-in page. It is set or
actively cleared on every sign-in, so a customer signing in after the manager
on the shop laptop does not inherit the strip, and it is deleted with the
session on sign-out.

`StaffBar` draws it above the announcement bar, through `useSyncExternalStore`
rather than a `setState` in an effect — the same two-snapshot shape as
`hydratedStore`. The cost is one small downward shift on a staff member's own
screen after hydration, and nothing at all on a customer's. The build output is
the check that the shop is still static: `/`, `/silai`, `/cart`, `/wishlist`
and `/track-order` all stay ○.

### 4.16 A guest can find a parcel without an account

`/track-order` takes an order number and the email it was placed with, and shows
the timeline, the courier, the tracking link and the parcel contents. Most
FEEZEE orders are placed without an account, and "sign in to see your order" is
not an answer to "where is my order".

**The order number alone is the credential.** The email field is still on the
form and is checked when it is filled in, but nothing requires it: someone
reading the number off a printed receipt, a WhatsApp message or a friend's
phone should not also have to remember which address the order was placed
with. A supplied-but-wrong email returns the same "no order found" as a bad
number, so it never becomes an oracle for "does this address shop here".

**What makes that safe is the other half of the order number.** Dropping the
email left the number as the only credential, and a number off a bare sequence
is not a credential at all — anyone willing to count from their own order could
read everyone else's. So the number stopped being a bare sequence (4.6): four
random characters now hang off it, and holding one reveals nothing about any
other. Two things follow from that and are worth keeping in view.

Old numbers are the exception, and keep the email requirement. A plain
`FZ-26-1004` is pure sequence and therefore not a credential at all, so
`trackOrder` refuses it on its own — enforced in the module rather than only at
the caller, since a later caller cannot be relied on to remember why. The form
asks for the email up front, decided from the **shape of what was typed** and
never from whether such an order exists, so the prompt cannot be used to test
whether a number is real. Without that, someone with a genuine old order would
be told "no order found" and go hunting for a mistake they had not made.

`TrackedOrder` is still the answer to *what one order number gets you*: status,
courier, parcel contents, invoice totals, the customer's name and area. No
`userId`, no payment transactions, no street address, no phone. Adding a field
is a decision about that question, not a convenience.

And `trackOrderAction` throttles to twenty lookups a minute per caller. Four
characters is about 920,000 combinations, which ends enumeration but would not
by itself stop a script pointed at one number all afternoon; the throttle makes
that roughly a month per order, while sitting far above anything a real
customer does. It is in memory, so it resets on deploy and does not span
instances — that is the honest limit of it, and where it would move if the shop
ever ran more than one node.

Because the number is now longer and read off a phone screen,
`orderNumberCandidates` rebuilds the canonical form when someone leaves the
dashes out: `fz261005k7qm` and `FZ 26 1005 K7QM` both resolve. Only for the two
shapes the shop actually issues — anything else is tried exactly as typed.

**The lookup is a POST; the question arrives by GET.** The answer carries a
name and an invoice, so it is never in a URL anyone can forward. The question
is, because both emails link straight here — `/track-order?order=FZ-26-1005`,
built by `trackOrderUrl` in `lib/site.ts` — and `track-form.tsx` prefills the
field and runs the lookup itself, so a tap in the email lands on the parcel
rather than on a form. Nothing personal is in that link: the email was dropped
from it the moment it stopped being required, because it would then have been
pure cost — a customer's address in their history, in a `Referer` header and in
the access log, buying nothing. The page still sets `referrer: no-referrer`,
which is what stops the order number travelling to the courier's site on the
click through.

The param is read through `useSearchParams`, so the form sits behind a
`<Suspense>` boundary and `/track-order` stays ○ in the build output. It is
captured **once**, into a `useState` initialiser, because `window.history`
updates sync back into that hook and a later change must not reach in and
rewrite a field the customer has since typed into. The auto-lookup calls
`requestSubmit()` on the real form rather than the action directly, so the
pending state, the validation and the error path are the ones a typed
submission gets.

Drawing the same timeline from a client component meant moving `orderTimeline`
out of the `server-only` orders module into `src/modules/orders/timeline.ts`,
and typing `OrderTimeline` against a structural `TimelineOrder` instead of
`OrderView`. Every existing server caller is unchanged.

### 4.16b An account is optional, and every surface has to say so

Most FEEZEE orders are placed as a guest, so the order number and the email are
not a fallback route to the order — for most customers they are *the* route.
Four places now say it in the same words rather than leaving it to be inferred:

- the confirmation email opens with an **Order Tracking & Reference** block —
  the number labelled as the tracking reference, a primary button that needs
  nothing typed, and the sentence that an account is completely optional and
  that the number on its own is enough;
- the dispatch email carries **both** buttons. The courier's page has the scans
  but goes dark for a few hours after handover and sometimes 404s a number it
  has not ingested; ours always answers and shows the timeline, the contents and
  the invoice. Neither replaces the other, so the customer gets both rather than
  a guess about which they wanted;
- the receipt page leads with a **Track your delivery** card, above the payment
  instructions and the invoice, because that number is what someone comes back
  for a week later;
- a guest receipt then offers account creation **once, and as an aside** —
  worded so it is plainly about saving details next time, not about unlocking
  anything, because it is not.

`siteHost` in `lib/site.ts` is what lets the copy read "feezee.ae/track-order"
aloud without hardcoding a domain that could drift from `site.url` — and
without an email in production ever reading "localhost:3000", which is why a
development origin falls back to the real domain rather than echoing itself.

### 4.17 Refunds are executed, not just recorded

Marking a return REFUNDED on a card order now calls Stripe. Two details carry
the weight.

**Stripe is called before the record says it happened.** REFUNDED has no next
status, so the form cannot be saved again — marking the return first and then
failing would leave it closed with the customer still waiting for money that was
never sent. A refusal is surfaced verbatim ("amount exceeds the charge") and
nothing changes. The call is also deliberately outside `resolveReturn`'s
transaction, for the same reason as 4.4.

**The return number is the idempotency key.** A form saved twice, or a retry
after a timeout, gets the first refund back rather than sending a second one,
and a `STRIPE_REFUND` transaction row is written as the evidence.

The id a refund is issued against is the payment *intent*, but
`checkout.session.completed` gives a session id (`cs_…`). The webhook now
records the intent alongside it, and `resolveStripePaymentIntent` resolves older
rows that only have the session. Cash on delivery and bank transfer keep the
manual payout reminder — shown on the form before the click, not only after.

### 4.18 Product photographs are uploaded, not copied in by hand

`/api/admin/upload` takes a JPEG, PNG or WebP under 10 MB from the product
editor and writes it into `public/img/uploads/`, returning the relative path the
`ProductImage.url` column holds. It is staff-guarded, answers 401 rather than
redirecting (it is fetched, not navigated to), and does not trust the browser
twice over: the **magic bytes are checked against the declared MIME type**, so a
`.jpg` that is really a script never reaches the disk, and the filename is taken
through `basename` and reduced to `[a-z0-9-]` plus a timestamp — needed because
`next.config.ts` caches `/img/*` immutably for a year, so a reused name would
leave the old picture on screen.

This is a local filesystem write. It is right for a shop running its own server
and wrong for an ephemeral one (Vercel and the like), where it wants a blob
store behind the same route.

### 4.19 Staff have one door, and it is not the shop's

An administrator's password used to open both forms. Nothing was *unguarded* by
that — `/admin` has always been behind `requireStaff` (4.8), so a customer
session could never reach the back office — but the reverse direction meant the
credentials that refund an order were also typed into the storefront's public
sign-in, which is the form that gets credential-stuffed, phished and pasted into
a shared laptop.

So `login` now takes the door as an argument. The back office passes `"staff"`
and the shop passes `"customer"`, and each refuses the other's accounts.

The refusals are not symmetrical, deliberately:

- **A customer at the admin door** is answered exactly like a wrong password.
  Anything else would confirm that an address shops here.
- **Staff at the shop's door** are told plainly that it is a staff account and
  shown a link to `/admin/login`. That branch is only reached *after* bcrypt has
  accepted the password, so the person reading the sentence already holds
  credentials that open the back office and learns nothing from it — while a
  manager who was simply on the wrong page gets a way in rather than a form that
  says only "no". `StaffDoorError` exists to carry that one case; every other
  failure is still the single generic sentence of 4.9.

Staff still *shop*: a session minted at `/admin/login` reaches `/account`,
`/wishlist` and the checkout like any other. It is the sign-in form that is
separated, not the person. The round trip between the two halves is 4.15 — "View
the shop ↗" out of the sidebar, the `feezee_staff` strip back in — and
`/admin/login` itself now carries a "Return to the shop ↗" line, since the
layout draws no navigation at all until there is somebody signed in to draw it
for.

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
- **`WishlistItem` is unique on `(userId, productId)`.** That uniqueness is what
  makes a toggle idempotent: a double-tap, or the same merge arriving from two
  tabs, cannot save the same garment twice. Both foreign keys cascade, so a
  closed account leaves nothing behind.
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
- The two sign-in doors (4.19), exercised against the live database: admin
  credentials at the shop's form are refused with `StaffDoorError`, the same
  credentials with a wrong password give the generic sentence, a customer at the
  admin form is refused as a wrong password, and a customer at the shop's form
  signs in unchanged.

---

## 9. Known gaps

- **No automated test suite.** The verification above was a script run against a
  live database, not something CI can repeat. A Vitest suite over
  `src/modules/` is the obvious next step.
- **Uploads are a local filesystem write.** `/api/admin/upload` (4.18) writes
  into `public/img/uploads/`, which is right for a shop running its own server
  and wrong for an ephemeral one. A hosted deployment wants a blob store behind
  the same route.
- **`npm audit` reports 4 highs**, all inside the `prisma` CLI devDependency
  (`@prisma/config` → `deepmerge-ts`, and `mysql2`, which this project does not
  use). Nothing ships to the runtime bundle. `npm audit fix --force` would
  install the Prisma 8 release candidate, which is worse.
- **A guest still cannot list past orders.** `/track-order` (4.16) finds one
  order from its number; there is no "everything this address has ever bought"
  without an account, and deliberately so.
- **The tracking throttle is per-process and in memory** (4.16). It resets on
  deploy and does not span instances, so it raises the cost of guessing rather
  than fixing it. It wants a shared store the day the shop runs more than one
  node.
- **Delivery copy is UAE; heritage copy is not, on purpose.** `values.ts`, the
  Silai page and the assistant now quote Dubai and the 7 Emirates, AED pricing
  and the Madina Mall boutique. The hero still reads "stitched the Pakistani
  way", which is a statement about the cut and the craft rather than an
  operational claim, and stays.
- **Existing staff sessions predate the `feezee_staff` cookie** (4.15). A
  cookie can only be set from a server action or a route handler, not from a
  layout render, so anyone already signed in sees the dashboard strip after
  their next sign-in.
