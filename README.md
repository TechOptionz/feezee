# FEEZEE Store

A production e-commerce site for **FEEZEE SILAI FASHION L.L.C**, a womenswear
boutique in Madina Mall, Dubai. Next.js 16 (App Router) + TypeScript + Tailwind
CSS v4 + PostgreSQL, with a customer account portal and a full back office.

It began as a pixel-faithful implementation of the `FEEZEE Store.dc.html` Claude
Design project. The design is unchanged; what sits behind it is now a shop.

For architecture and the reasoning behind the decisions, read
[PROJECT_MEMORY.md](./PROJECT_MEMORY.md).

## Getting started

You need Node 20+ and Docker (or any PostgreSQL 16 you can point at).

```bash
cp .env.example .env       # then set SESSION_SECRET to something long
npm install
npm run setup              # starts Postgres, pushes the schema, seeds the catalogue
npm run dev
```

`npm run setup` is the three database steps in one. To do them separately:

```bash
npm run db:up              # docker compose up -d
npm run db:push            # create the schema
npm run db:seed            # migrate the 21 garments in from src/content/
```

Then:

- Shop — <http://localhost:3000>
- Back office — <http://localhost:3000/admin> · `admin@feezee.ae` / `FeezeeAdmin2026!`

**Change that password before this goes anywhere real.**

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run setup` | Database up, schema pushed, catalogue seeded |
| `npm run db:up` / `db:down` | Start / stop PostgreSQL |
| `npm run db:push` | Sync the schema to the database |
| `npm run db:seed` | Seed the catalogue, settings and admin |
| `npm run db:reset` | Wipe and re-seed — destroys all orders |
| `npm run db:studio` | Prisma Studio |

## Structure

```
prisma/
  schema.prisma            16 models. Money is Decimal(10,2), never a float.
  seed.ts                  One-way door: content files → database rows.
prisma.config.ts           Prisma 7 config (the CLI's connection URL).
docker-compose.yml         PostgreSQL 16, with a healthcheck.

src/
  modules/                 The business. No JSX, no routing.
    shared/                Money, store settings, policy defaults
    catalogue/             DB-backed reads in the design's Product shape
    inventory/             Concurrency-safe stock + the adjustment ledger
    checkout/              UAE validation, VAT, delivery
    payments/              Stripe · Cash on Delivery · bank transfer
    orders/                Order numbers, placement, state machine
    shipping/              UAE couriers and tracking URLs
    customers/             Accounts, sessions, address book
    returns/               Requests, approval, refund, restock
    reporting/             Metrics, charts, CSV export
    notifications/         Email transport + branded templates
    admin/                 Role guards and the audit log

  app/
    actions/               Server actions: cart, checkout, account, admin
    page.tsx               Home
    product/[slug]/        A garment — gallery, buying panel, rails
    new-in · sale · …      The five shop pages
    cart · checkout        Bag, then a UAE checkout
    order-confirmation/    The receipt, reachable by order number
    account/               Sign in, orders, returns, addresses
    admin/                 Dashboard, catalogue, inventory, orders, returns,
                           customers, reports, audit log
    api/webhooks/stripe/   The only thing that may mark a card order paid

  components/              layout · sections · product · cart · shop · silai
  content/                 Editorial data and the seed source
  lib/                     prisma, assets, currency, site, utils
  styles/tokens.css        Every design colour and layout constant
```

Three rules keep this maintainable:

1. **Design values live only in `src/styles/tokens.css`.** Components use the
   Tailwind utilities those tokens map onto (`bg-cream`, `text-muted`,
   `border-line`), so a palette change never touches component code.
2. **A page decides what to show; a module decides what is true.** If a page
   contains a business rule, it is in the wrong place.
3. **The browser never sends a price.** A basket is variant ids and quantities.
   Everything on the invoice is computed on the server.

Base element styles in `globals.css` sit inside `@layer base` — unlayered CSS
beats every Tailwind utility regardless of specificity, which would silently
override colours set on components.

## The catalogue

`src/content/products.ts` and `product-detail.ts` were the source of truth while
this was a showcase. They are now **seed input**, plus the home of editorial data
that is not commerce: which garments open each drop tab, the order the boutique
rail hangs in, the journal, the Silai page, the assistant's script, the size
chart.

Everything commercial — price, stock, whether a piece is still for sale — lives
in the database and is read through `src/modules/catalogue/`. So a price changed
in the admin shows on the home page, and an archived garment leaves every grid.

Each garment has **six variants** (XS–XXL), each with its own SKU and its own
stock. A size is a thing you can run out of, not a label.

## Shopping

```
/product/<slug>
  ├─ gallery      every frame: a grid on a desktop, a swipe rail on a phone
  ├─ panel        price · SKU · live stock per size · quantity · add to bag
  ├─ rail         "You May Also Like"
  └─ journal      "Featured Articles"

/cart             quantities, live stock warnings, VAT and delivery preview
/checkout         guest or signed in · UAE address · card, cash or transfer
/order-confirmation/<orderNumber>   receipt, timeline, tracking, WhatsApp
```

The bag lives in `localStorage` and carries a display snapshot so the drawer
draws instantly — but every price is recomputed on the server when the bag is
priced and again when the order is placed.

## Accounts and the back office

`/account` — overview, orders, order detail with a tracking timeline, return
requests, and a UAE address book.

`/admin` — ink and champagne rather than cream and gold, so a glance says which
of the two you are looking at:

| Route | What it does |
| --- | --- |
| `/admin` | Revenue, orders, AOV, pending, low stock, charts, date filters |
| `/admin/products` | Catalogue CRUD, search, filter, archive |
| `/admin/inventory` | Variant matrix; click a count to recount it, with a reason |
| `/admin/orders` | Filter, search, then fulfil — courier, tracking, cancel |
| `/admin/returns` | Approve, reject, refund, and restock as a separate decision |
| `/admin/customers` | Directory with lifetime value |
| `/admin/reports` | The same figures, downloadable as CSV |
| `/admin/audit-logs` | Who changed what, with a before/after diff |

Staff sign in at `/admin/login`. Roles are `ADMIN` and `STAFF`; a `CUSTOMER`
account is refused there exactly as a wrong password would be.

## Assets

Images live in `public/img/`. Reference them through the helper rather than
hardcoding paths:

```tsx
import Image from "next/image";
import { img } from "@/lib/assets";

<Image src={img("p14.jpg")} alt="…" fill sizes="100vw" className="object-cover" />
```

Setting `NEXT_PUBLIC_ASSET_BASE` moves every asset to a CDN without editing a
component. `/img/*` is served with a one-year immutable cache header (see
`next.config.ts`), so give a changed image a new filename.

`design-source/` holds the original export. It is excluded from lint, TypeScript
and deploys — nothing in the app imports from it.

## Environment

| Variable | Purpose | Without it |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL | the app will not start |
| `SESSION_SECRET` | Signs the session cookie (≥ 32 chars) | sign-in throws |
| `NEXT_PUBLIC_SITE_URL` | Metadata, emails, payment returns | `localhost:3000` |
| `STRIPE_SECRET_KEY` | Cards and Apple Pay | the card option is withdrawn |
| `STRIPE_WEBHOOK_SECRET` | Marking card orders paid | the webhook 400s |
| `BANK_TRANSFER_IBAN` | Bank transfer option | the option is withdrawn |
| `RESEND_API_KEY` | Sending email | emails print to the console |
| `NEXT_PUBLIC_ASSET_BASE` | Serve `public/` from a CDN | served from the app |

A missing optional key never breaks a page — the feature it powers is withdrawn
cleanly.

## Deploying

Vercel detects Next.js automatically. Point `DATABASE_URL` at a managed
PostgreSQL (Neon, Supabase, RDS), set the variables above, and run
`npx prisma db push` against it once.

```bash
vercel            # preview
vercel --prod     # production
```

Add the Stripe webhook at `https://<your-domain>/api/webhooks/stripe`.

## Differences from the source design

- **Responsive switching is CSS, not JavaScript.** The design toggled the mobile
  drawer from a `window.innerWidth < 860` listener; here the same 860px
  breakpoint is a Tailwind breakpoint (`nav:`), so the correct layout is in the
  server-rendered HTML with no hydration flash.
- **Currency is build-time configuration.** `currency` and `showAnnouncement`
  were design-editor props; they now live in `src/lib/site.ts` and
  `src/lib/currency.ts`.
- **A grid tile no longer adds to the bag.** A size is a SKU with its own stock,
  so a tile that added one would be picking a size on the customer's behalf. It
  links to the garment's page instead.
