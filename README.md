# FEEZEE Store

A pixel-faithful Next.js implementation of the `FEEZEE Store.dc.html` Claude Design
project. Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, deployable on
Vercel with zero configuration.

## Getting started

```bash
npm install
npm run dev
```

## Structure

```
src/
  app/
    layout.tsx           Fonts (Marcellus + Jost), metadata, StoreProvider
    globals.css          Tailwind entry; maps design tokens to Tailwind namespaces
    page.tsx             Composes the page from sections, in design order
    product/[slug]/      One garment's own page — gallery, buying panel, rail
    journal/[slug]/      One article
  components/
    layout/              announcement-bar · header · mobile-menu · footer
    product/             product-gallery · product-panel · share-row
    sections/            hero · categories · new-arrivals · silai · values · lookbook
                         · featured-articles
    store/               store-provider — bag, wishlist and drawer state
    ui/                  product-card · wordmark · icons
  content/
    products.ts          Catalogue, categories, lookbook, slugs and galleries
    product-detail.ts    Sizes and stock, per-garment copy, the house size chart
    journal.ts           The three journal articles
    navigation.ts        Primary and footer navigation
    values.ts            The four value propositions
  lib/
    assets.ts            Asset path helpers
    currency.ts          PKR/AED/GBP formatting
    site.ts              Site metadata and store settings
    utils.ts             cn() class merging helper
  styles/
    tokens.css           Every design colour and layout constant
public/
  img/                   Design images, original filenames (p01–p31)
design-source/           The original Claude Design export, kept for reference
```

Two rules keep this maintainable:

1. **Design values live only in `src/styles/tokens.css`.** Components use the
   Tailwind utilities those tokens map onto (`bg-cream`, `text-muted`,
   `border-line`), so a palette change never touches component code.
2. **Copy and catalogue live only in `src/content/`.** Adding a product or a nav
   link is a data edit, not a component edit.

Base element styles in `globals.css` sit inside `@layer base` — unlayered CSS
beats every Tailwind utility regardless of specificity, which would silently
override colours set on components.

## Product pages

`/product/<slug>` is a garment on a page of its own. Every one of them is
prerendered at build time from `content/products.ts` — the slug, the SKU and the
list of photographs are all derived from the catalogue entry, so adding a
garment adds its page, its share links and its structured data with it.

```
/product/bahaar-lace-suit
  ├─ gallery      every frame of the piece: a grid on a desktop, a swipe rail on a phone
  ├─ panel        price · SKU · sizes · add to bag · wishlist · details/description/size guide
  ├─ rail         "You May Also Like" — same line first, then the nearest cut
  └─ journal      "Featured Articles" — the three pieces in content/journal.ts
```

Three things are worth knowing before editing it:

1. **The worn shot leads; the hanger follows.** `Product.img` is always the
   garment on a model — every card, bag row and rail reads off that one field,
   so the shop is a shop of people wearing clothes. The hanger frames sit in
   `HANGER_FRAMES` and only ever appear behind the worn shot on the garment's
   own page, where they answer what actually arrives in the parcel. The single
   exception is the boutique rail on the home page, which leads on hangers on
   purpose. No photograph is used by two garments; a repeat is a bug.
2. **A size is part of a bag line, not a note on one.** `CartLine` carries an
   optional `size`, and every bag operation takes it — the same suit in L and in
   XL is two rows. A card in a grid still adds without one, and that row says so
   rather than inventing a size.
3. **Stock lives in `content/product-detail.ts`.** `STOCK` marks the sizes that
   are gone or nearly gone; a garment with no entry runs the full XS–XXL. The
   page opens on the first size still on the rail, which is what keeps "Add to
   Bag" live on arrival, and falls back to a "Sold out" button with a Silai
   offer when nothing is left.

Copy for a garment — the colour, the pieces in the box, the description — is
keyed by catalogue id in the same file, with a derived fallback, so a garment
added to the catalogue without copy still has a page that answers the basics.

## Assets

Images live in `public/img/`. Shoot frames carry a descriptive name
(`suit-sage-tissue.jpg`, `kurta-rani-zari.jpg`); the `p01`–`p31` files are the
original hanger and rack frames from the source design, kept under their own
names. Reference either through the helper rather than hardcoding paths:

```tsx
import Image from "next/image";
import { img } from "@/lib/assets";

<Image src={img("p14.jpg")} alt="…" fill sizes="100vw" className="object-cover" />
```

Setting `NEXT_PUBLIC_ASSET_BASE` moves every asset to a CDN without editing a
component. `/img/*` is served with a one-year immutable cache header (see
`next.config.ts`), so give a changed image a new filename.

`design-source/` holds the original export. It is excluded from lint, TypeScript
and deploys (`.vercelignore`) — nothing in the app imports from it.

## Differences from the source design

The design is reproduced exactly, with two implementation-level changes:

- **Responsive switching is CSS, not JavaScript.** The design toggled the mobile
  drawer and desktop nav from a `window.innerWidth < 860` listener. Here the same
  860px breakpoint is a Tailwind breakpoint (`nav:`), so the correct layout is in
  the server-rendered HTML with no hydration flash.
- **Currency is build-time configuration.** `currency` and `showAnnouncement`
  were design-editor props; they now live in `src/lib/site.ts` and
  `src/lib/currency.ts`. Making currency user-switchable is a matter of moving it
  into `StoreProvider` state — the formatting already flows through context.

## Deploying to Vercel

Vercel detects Next.js automatically — no `vercel.json` needed.

```bash
npm i -g vercel   # once
vercel            # preview deployment
vercel --prod     # production
```

| Variable                 | Purpose                                  |
| ------------------------ | ---------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`   | Canonical URL used for metadata          |
| `NEXT_PUBLIC_ASSET_BASE` | Serve `public/` assets from a CDN origin |

## Scripts

| Command         | Description                |
| --------------- | -------------------------- |
| `npm run dev`   | Development server         |
| `npm run build` | Production build           |
| `npm start`     | Serve the production build |
| `npm run lint`  | ESLint                     |
