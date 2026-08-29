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
  components/
    layout/              announcement-bar · header · mobile-menu · footer
    sections/            hero · categories · new-arrivals · silai · values · lookbook
    store/               store-provider — bag, wishlist and drawer state
    ui/                  product-card · wordmark · icons
  content/
    products.ts          Catalogue, categories and lookbook
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

## Assets

Images live in `public/img/` under the filenames used by the source design.
Reference them through the helper rather than hardcoding paths:

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
