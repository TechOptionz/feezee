export type Collection =
  | "Printed Lawn"
  | "Luxury Pret"
  | "Ready to Wear"
  | "Sale";

/** The three lines that make up "New In". Sale sits outside them by design. */
export const NEW_IN_COLLECTIONS = [
  "Printed Lawn",
  "Luxury Pret",
  "Ready to Wear",
] as const satisfies readonly Collection[];

/** What the garment is, for the Category facet. Mutually exclusive. */
export type ProductType = "Kurtas" | "Suits" | "Co-ords";

export type Product = {
  id: number;
  name: string;
  /** The caption under the name on a card. */
  fabric: string;
  /** Single word for the Fabric facet, drawn out of `fabric`. */
  fabricFamily: string;
  type: ProductType;
  /** Shirt only (1), shirt and bottom (2), or shirt, bottom and dupatta (3). */
  pieces: 1 | 2 | 3;
  /** True when the piece is sold with its dupatta — the "Dupatta Sets" facet. */
  withDupatta: boolean;
  /**
   * The line the piece belongs to. Exactly one, which is what keeps "New In"
   * (the three lines together) and "Sale" from ever showing the same garment.
   */
  collection: Collection;
  /** Price in PKR — formatted per currency at render time. */
  pkr: number;
  /** Original price in PKR, when the item is discounted. */
  wasPkr?: number;
  img: string;
  badge?: { label: string; tone: "gold" | "wine" };
};

/**
 * The whole catalogue: one entry per garment, one photograph per entry.
 *
 * `img` is always the garment worn — the shoot frame, never the hanger. That is
 * the rule the whole shop is built on: a card in a grid, a bag row and a search
 * result all read off this field, so every one of them shows the piece on a
 * body. The hanger frames live in `HANGER_FRAMES` below and only ever come
 * second, behind the worn shot, on the garment's own page. The one place a
 * hanger leads is the boutique rail, which is deliberately a walk past the rack.
 *
 * No file is used twice. Each worn frame belongs to exactly one garment, which
 * is what keeps a piece from turning up in two grids wearing two different
 * names — and what makes a repeated photograph a bug rather than a style.
 *
 * `public/img/` also holds byte-identical copies under different names
 * (p01/p06, p02/p07, p03/p05/p10, p04/p08) and four WhatsApp screenshots
 * (p04, p08, p18, p21) that are not usable as product photography. Neither
 * kind is referenced from here.
 */
export const products: Product[] = [
  {
    id: 1,
    name: "Sabz Tissue Suit",
    fabric: "Sage tissue, 3 pc",
    fabricFamily: "Tissue",
    type: "Suits",
    pieces: 3,
    withDupatta: true,
    collection: "Luxury Pret",
    pkr: 15900,
    img: "suit-sage-tissue.jpg",
    badge: { label: "New", tone: "gold" },
  },
  {
    id: 2,
    name: "Gulaab Rose Pret",
    fabric: "Embroidered lawn, 3 pc",
    fabricFamily: "Lawn",
    type: "Suits",
    pieces: 3,
    withDupatta: true,
    collection: "Sale",
    pkr: 8680,
    wasPkr: 12400,
    img: "suit-rose-pink.jpg",
    badge: { label: "Sale", tone: "wine" },
  },
  {
    id: 3,
    name: "Bahaar Lace Suit",
    fabric: "Printed lawn with lace, 3 pc",
    fabricFamily: "Lawn",
    type: "Suits",
    pieces: 3,
    withDupatta: true,
    collection: "Printed Lawn",
    pkr: 11800,
    img: "dupatta-ivory-lace.jpg",
    badge: { label: "Best Seller", tone: "wine" },
  },
  {
    id: 4,
    name: "Zarrin Gold Co-ord",
    fabric: "Raw silk, 2 pc",
    fabricFamily: "Silk",
    type: "Co-ords",
    pieces: 2,
    withDupatta: false,
    collection: "Luxury Pret",
    pkr: 11500,
    img: "coord-gold-silk.png",
  },
  {
    id: 5,
    name: "Shirin Maroon Zari",
    fabric: "Maroon raw silk, 2 pc",
    fabricFamily: "Silk",
    type: "Kurtas",
    pieces: 2,
    withDupatta: false,
    collection: "Ready to Wear",
    pkr: 8950,
    img: "kurta-maroon-zari.png",
  },
  {
    id: 6,
    name: "Laila Patola Print",
    fabric: "Printed viscose",
    fabricFamily: "Viscose",
    type: "Kurtas",
    pieces: 1,
    withDupatta: false,
    collection: "Printed Lawn",
    pkr: 7250,
    img: "kurta-patola-print.jpg",
  },
  {
    id: 7,
    name: "Siyah Ikat Suit",
    fabric: "Printed cambric, 3 pc",
    fabricFamily: "Cambric",
    type: "Suits",
    pieces: 3,
    withDupatta: true,
    collection: "Sale",
    pkr: 7090,
    wasPkr: 9450,
    img: "dupatta-printed-chiffon.jpg",
    badge: { label: "Sale", tone: "wine" },
  },
  {
    id: 8,
    name: "Feroza Lace Pret",
    fabric: "Embroidered grip, 3 pc",
    fabricFamily: "Grip",
    type: "Suits",
    pieces: 3,
    withDupatta: true,
    collection: "Ready to Wear",
    pkr: 13200,
    img: "suit-feroza-lace.jpg",
  },
  {
    id: 9,
    name: "Zumurrud Anarkali",
    fabric: "Chiffon anarkali, 2 pc",
    fabricFamily: "Chiffon",
    type: "Suits",
    pieces: 2,
    withDupatta: false,
    collection: "Luxury Pret",
    pkr: 18500,
    img: "suit-sea-green-anarkali.jpg",
    badge: { label: "New", tone: "gold" },
  },
  {
    id: 10,
    name: "Ajrak Co-ord Set",
    fabric: "Block-printed cotton, 2 pc",
    fabricFamily: "Cotton",
    type: "Co-ords",
    pieces: 2,
    withDupatta: true,
    collection: "Printed Lawn",
    pkr: 7450,
    img: "coord-ajrak.jpg",
  },
  {
    id: 11,
    name: "Neelam Teal Suit",
    fabric: "Embroidered grip, 3 pc",
    fabricFamily: "Grip",
    type: "Suits",
    pieces: 3,
    withDupatta: true,
    collection: "Luxury Pret",
    pkr: 13800,
    img: "suit-teal-embroidered.jpg",
  },
  {
    id: 12,
    name: "Gulbahar Palm Kurta",
    fabric: "Printed cotton silk",
    fabricFamily: "Silk",
    type: "Kurtas",
    pieces: 1,
    withDupatta: false,
    collection: "Sale",
    pkr: 5590,
    wasPkr: 8600,
    img: "kurta-ivory-palm.jpg",
    badge: { label: "Sale", tone: "wine" },
  },
  {
    id: 14,
    name: "Noor Midnight Kurta",
    fabric: "Black embroidered lawn",
    fabricFamily: "Lawn",
    type: "Kurtas",
    pieces: 1,
    withDupatta: false,
    collection: "Ready to Wear",
    pkr: 9200,
    img: "kurta-noir-midnight.jpg",
  },
  {
    id: 15,
    name: "Sahar Ivory Pret",
    fabric: "Self-embroidered grip",
    fabricFamily: "Grip",
    type: "Kurtas",
    pieces: 1,
    withDupatta: false,
    collection: "Ready to Wear",
    pkr: 7900,
    img: "kurta-sahar-ivory.jpg",
  },
  {
    id: 16,
    name: "Sadaf Grey Blossom",
    fabric: "Embroidered cambric",
    fabricFamily: "Cambric",
    type: "Kurtas",
    pieces: 1,
    withDupatta: false,
    collection: "Sale",
    pkr: 3950,
    wasPkr: 5650,
    img: "kurta-grey-blossom.jpg",
    badge: { label: "Sale", tone: "wine" },
  },
  {
    id: 17,
    name: "Shab Noir Luxury Suit",
    fabric: "Embroidered lawn, 3 pc",
    fabricFamily: "Lawn",
    type: "Suits",
    pieces: 3,
    withDupatta: true,
    collection: "Luxury Pret",
    pkr: 16900,
    img: "dupatta-black-net.jpg",
    badge: { label: "New", tone: "gold" },
  },
  {
    id: 18,
    name: "Mehr Mint Chikankari",
    fabric: "Chikankari lawn, 3 pc",
    fabricFamily: "Lawn",
    type: "Suits",
    pieces: 3,
    withDupatta: true,
    collection: "Luxury Pret",
    pkr: 14500,
    img: "dupatta-mint-organza.jpg",
  },
  {
    id: 19,
    name: "Rani Zari Kurta",
    fabric: "Zari-dotted raw silk",
    fabricFamily: "Silk",
    type: "Kurtas",
    pieces: 1,
    withDupatta: false,
    collection: "Ready to Wear",
    pkr: 8450,
    img: "kurta-rani-zari.jpg",
  },
  {
    id: 20,
    name: "Kaali Ajrak Co-ord",
    fabric: "Ajrak cotton, 2 pc",
    fabricFamily: "Cotton",
    type: "Co-ords",
    pieces: 2,
    withDupatta: true,
    collection: "Printed Lawn",
    pkr: 7850,
    img: "coord-black-ajrak.jpg",
    badge: { label: "Best Seller", tone: "wine" },
  },
  {
    id: 21,
    name: "Monochrome Block Co-ord",
    fabric: "Block-printed cambric, 2 pc",
    fabricFamily: "Cambric",
    type: "Co-ords",
    pieces: 2,
    withDupatta: false,
    collection: "Sale",
    pkr: 4870,
    wasPkr: 6950,
    img: "coord-monochrome.jpg",
    badge: { label: "Sale", tone: "wine" },
  },
  {
    id: 22,
    name: "Anaya Rose Lawn",
    fabric: "Printed lawn",
    fabricFamily: "Lawn",
    type: "Kurtas",
    pieces: 1,
    withDupatta: false,
    collection: "Sale",
    pkr: 3390,
    wasPkr: 4850,
    img: "kurta-rose-print.jpg",
    badge: { label: "Sale", tone: "wine" },
  },
];

/** Every product keyed by id, so a group only has to carry the ids it shows. */
const byId = new Map(products.map((p) => [p.id, p]));

/** The one product with this id, or undefined. */
export function productById(id: number): Product | undefined {
  return byId.get(id);
}

/** The products of `ids`, in the order given. Unknown ids are skipped. */
export function productsByIds(ids: readonly number[]): Product[] {
  return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
}

/** Everything in one line, in catalogue order. */
export function productsInCollection(collection: Collection): Product[] {
  return products.filter((p) => p.collection === collection);
}

/**
 * "New In" is not a line of its own: it is the three shop lines put together,
 * which is why nothing on sale can appear in it and nothing new can appear on
 * the sale page.
 */
export function newInProducts(): Product[] {
  return products.filter((p) =>
    (NEW_IN_COLLECTIONS as readonly Collection[]).includes(p.collection),
  );
}

/** Percentage off, rounded, for a discounted piece — or null at full price. */
export function discountPct(product: Product): number | null {
  if (!product.wasPkr || product.wasPkr <= product.pkr) return null;
  return Math.round((1 - product.pkr / product.wasPkr) * 100);
}

/**
 * "New Arrivals" on the home page is split the same way the shop is: a drop per
 * line, each with its own copy and its own four looks. The group names double
 * as the tabs under the section heading, and `href` is the shop page that holds
 * the rest of the line — the section is the trailer, the page is the film.
 *
 * The four ids in a group all belong to that line, and no two of them share a
 * colour story: a grid of four ivories reads as a mistake even when it isn't.
 * The item count is read off the line itself, so it can never drift.
 */
export type NewArrivalGroup = {
  name: (typeof NEW_IN_COLLECTIONS)[number];
  blurb: string;
  href: string;
  /** The four looks the section puts on screen for this line. */
  productIds: number[];
};

export const newArrivalGroups: NewArrivalGroup[] = [
  {
    name: "Printed Lawn",
    blurb:
      "Everyday prints on breathable lawn and cambric — block motifs, heritage panels and a colour story cut for long summers.",
    href: "/printed-lawn",
    productIds: [6, 3, 20, 10],
  },
  {
    name: "Luxury Pret",
    blurb:
      "Tissue, organza and chikankari finished by hand. Occasion pieces that arrive ready to wear, dupatta included.",
    href: "/luxury-pret",
    productIds: [1, 17, 9, 4],
  },
  {
    name: "Ready to Wear",
    blurb:
      "Stitched in our standard sizing and shipped the same week — the kurtas and pret we keep on the rail year round.",
    href: "/ready-to-wear",
    productIds: [5, 15, 8, 14],
  },
];

/**
 * "Shop by Category" tabs. The four words in the section header are the filter:
 * picking one swaps the four looks below it, so each tab carries its own set.
 * Looks are grouped by what the photo actually shows — a solo shirt under
 * Kurtas, a shirt shot with its dupatta under Suits or Dupattas, a full
 * shirt-and-trouser set under Co-ords. All sixteen ids are distinct: switching
 * tabs should never bring back a piece you just looked at.
 *
 * The tabs cut across the lines rather than sitting inside one, so "View all"
 * hands the same category to New In as a pre-set filter.
 */
export type CategoryTab = {
  name: string;
  /** Where "View all" goes for this tab. */
  href: string;
  productIds: number[];
};

export const categoryTabs: CategoryTab[] = [
  { name: "Kurtas", href: "/new-in?category=Kurtas", productIds: [12, 16, 19, 14] },
  { name: "Suits", href: "/new-in?category=Suits", productIds: [1, 2, 11, 9] },
  { name: "Co-ords", href: "/new-in?category=Co-ords", productIds: [10, 21, 20, 4] },
  {
    name: "Dupattas",
    href: "/new-in?category=Dupatta+Sets",
    productIds: [3, 18, 17, 7],
  },
];

/**
 * The boutique rail that closes the home page.
 *
 * Every garment here is photographed the way it hangs in the shop — on the
 * FEEZEE wall with its tag still on — rather than on a model, so the rail reads
 * as a walk past the rack rather than a second shoot. `productId` points the
 * frame at the piece it shows, which is what lets the rail print a name and a
 * price without keeping a second copy of either.
 *
 * The order is a colour order: no two neighbours share a story, so scrolling
 * sideways never runs through three ivories in a row.
 */
export type BoutiqueLook = {
  productId: number;
  /** The hanger frame of that piece, from `public/img/`. */
  img: string;
};

export const boutiqueRail: BoutiqueLook[] = [
  { productId: 3, img: "p03.jpg" }, // ivory lace
  { productId: 17, img: "p27.jpg" }, // black
  { productId: 1, img: "p15.jpg" }, // sage tissue
  { productId: 11, img: "p24.jpg" }, // teal
  { productId: 2, img: "p02.jpg" }, // rose
  { productId: 10, img: "p16.jpg" }, // ajrak
  { productId: 18, img: "p28.jpg" }, // mint
  { productId: 5, img: "p09.jpg" }, // maroon
  { productId: 21, img: "p31.jpg" }, // monochrome
  { productId: 9, img: "p14.jpg" }, // sea green
  { productId: 7, img: "p12.jpg" }, // black and ivory ikat
  { productId: 16, img: "p26.jpg" }, // grey
  { productId: 20, img: "p30.jpg" }, // black ajrak
];

/** One rail entry with its garment resolved. Unknown ids are skipped. */
export type BoutiqueEntry = { product: Product; img: string };

export function boutiqueLooks(): BoutiqueEntry[] {
  return boutiqueRail
    .map(({ productId, img }) => {
      const product = byId.get(productId);
      return product ? { product, img } : null;
    })
    .filter((look): look is BoutiqueEntry => look !== null);
}

/* ---------------------------------------------------------------------------
 * A garment's own page
 *
 * Everything below is what turns a card in a grid into a route. None of it is
 * new catalogue data: the slug, the SKU and the photographs are all derived
 * from the entries above, so adding a garment adds its page with it. The words
 * that only a product page says — colours, the pieces in the box, the
 * description — live in `content/product-detail.ts`.
 * ------------------------------------------------------------------------- */

/** "Sabz Tissue Suit" → "sabz-tissue-suit". */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** The garment's path segment. Derived, so it can never drift from the name. */
export function productSlug(product: Product): string {
  return slugify(product.name);
}

/** Where a card, a bag row or a rail points to reach this garment. */
export function productHref(product: Product): string {
  return `/product/${productSlug(product)}`;
}

const bySlug = new Map(products.map((p) => [slugify(p.name), p]));

/** The garment at `slug`, or undefined — an unknown slug is a 404. */
export function productBySlug(slug: string): Product | undefined {
  return bySlug.get(slug);
}

/** Every slug the shop serves, for `generateStaticParams`. */
export function allProductSlugs(): string[] {
  return products.map(productSlug);
}

/**
 * The rest of a garment's frames, in the order its page shows them behind the
 * worn shot.
 *
 * A product page opens on the piece as it is worn and then shows how it hangs:
 * the fall of the shirt, the dupatta on the rail beside it, the tag still on.
 * That order is the whole point of the list — the shoot frame sells the piece,
 * the hanger frame answers what actually arrives in the parcel — so anything
 * still on a model here (p19, p20) is listed before the hangers rather than
 * after them.
 *
 * Left out on purpose: the byte-identical copies (p05, p06, p07, p08, p10)
 * and the near-copies that differ only in crop (p01, the same hanger as p15
 * from a step to the side) — either would put one picture on a page twice —
 * and the four WhatsApp screenshots (p04, p08, p18, p21), which are not
 * photography. A garment with only its shoot frame simply shows that one,
 * full width.
 */
const HANGER_FRAMES: Record<number, string[]> = {
  1: ["p15.jpg"],
  2: ["p02.jpg"],
  3: ["p03.jpg"],
  5: ["p09.jpg"],
  6: ["p11.jpg"],
  7: ["p12.jpg"],
  8: ["p13.jpg"],
  9: ["p19.jpg", "p14.jpg"],
  10: ["p16.jpg", "p17.jpg"],
  11: ["p20.jpg", "p24.jpg"],
  14: ["p23.jpg"],
  15: ["p25.jpg"],
  16: ["p26.jpg"],
  17: ["p27.jpg"],
  18: ["p28.jpg"],
  19: ["p29.jpg"],
  20: ["p30.jpg"],
  21: ["p31.jpg"],
};

/** Every frame of a garment: the worn shot first, then how it hangs. */
export function productImages(product: Product): string[] {
  const frames = [product.img, ...(HANGER_FRAMES[product.id] ?? [])];
  return [...new Set(frames)];
}

/** Two letters per line, so a SKU says which rail the piece came off. */
const LINE_CODE: Record<Collection, string> = {
  "Printed Lawn": "PL",
  "Luxury Pret": "LP",
  "Ready to Wear": "RW",
  Sale: "SL",
};

/**
 * The stock code printed under the price, e.g. `FZ-LP-001`. It is built from
 * the line and the catalogue id rather than stored, so it cannot disagree with
 * either. The page appends the chosen size to it, which is what a size-level
 * code has to be for anyone reading it back to us on WhatsApp.
 */
export function productSku(product: Product): string {
  return `FZ-${LINE_CODE[product.collection]}-${String(product.id).padStart(3, "0")}`;
}

/**
 * What to show under a garment, in the order it is worth showing.
 *
 * Nearest first: the same line, then the same cut from another line, then
 * whatever else is on the rail — so a page always fills its rail, and a small
 * line never leaves it half empty. Catalogue order inside each band keeps the
 * result identical on the server and in the browser.
 */
export function relatedProducts(product: Product, count = 4): Product[] {
  const others = products.filter((p) => p.id !== product.id);
  const bands = [
    others.filter((p) => p.collection === product.collection),
    others.filter((p) => p.collection !== product.collection && p.type === product.type),
    others,
  ];
  const out: Product[] = [];
  for (const band of bands) {
    for (const p of band) {
      if (out.length >= count) return out;
      if (!out.includes(p)) out.push(p);
    }
  }
  return out;
}
