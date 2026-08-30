import {
  NEW_IN_COLLECTIONS,
  newInProducts,
  productsInCollection,
  type Collection,
  type Product,
} from "@/content/products";

/**
 * The five shop pages behind the nav. Everything a page needs that is not the
 * garments themselves lives here: the words at the top, the strip of copy under
 * the grid, and which products the page is allowed to show.
 *
 * `slug` is the route, so `/new-in`, `/printed-lawn` and so on. The order is
 * the order of the sub-nav that every one of these pages carries, and it
 * matches the order of the links in the header.
 */
export type ShopPage = {
  slug: string;
  /** The word in the sub-nav and the header. */
  nav: string;
  /** The heading, set large and uppercase. */
  title: string;
  /** Trail after Home, e.g. ["Woman", "New In"]. */
  breadcrumb: string[];
  /** Small caps line above the heading. */
  eyebrow: string;
  /** Standfirst under the heading. */
  intro: string;
  /** Browser title and meta description. */
  meta: { title: string; description: string };
  /** Photograph behind the page banner. */
  banner: string;
  /** The band of copy that closes the page, under the grid. */
  note: { title: string; body: string; points: string[] };
  /** Sale pages get wine accents instead of gold. */
  tone?: "sale";
};

export const shopPages: ShopPage[] = [
  {
    slug: "/new-in",
    nav: "New In",
    title: "New In",
    breadcrumb: ["Woman", "New In"],
    eyebrow: "This season",
    intro:
      "Everything that has landed across Printed Lawn, Luxury Pret and Ready to Wear — the three lines in one place, newest cuts first.",
    meta: {
      title: "New In",
      description:
        "Every new FEEZEE piece across Printed Lawn, Luxury Pret and Ready to Wear, in one grid.",
    },
    banner: "hero/look-03.jpg",
    note: {
      title: "One drop, three lines",
      body: "New In is not a line of its own. It is Printed Lawn, Luxury Pret and Ready to Wear put together, so a piece appears here the week it reaches the rail and leaves the moment it moves to sale.",
      points: [
        "Restocked every Thursday",
        "Dispatched within 48 hours",
        "Free delivery over Rs 5,000",
      ],
    },
  },
  {
    slug: "/ready-to-wear",
    nav: "Ready to Wear",
    title: "Ready to Wear",
    breadcrumb: ["Woman", "Ready to Wear"],
    eyebrow: "Stitched and shipped",
    intro:
      "Cut in our standard sizing and finished before it is listed. Order today, wear it this week — no measurements, no wait at the tailor.",
    meta: {
      title: "Ready to Wear",
      description:
        "Stitched FEEZEE kurtas and pret in standard sizing, dispatched the same week.",
    },
    banner: "hero/look-06.jpg",
    note: {
      title: "Sizing and fit",
      body: "Every piece runs in XS to XXL against our house block: a relaxed shoulder, a straight shirt and a full-length sleeve. If you are between two sizes the shirt takes the larger one and the trouser the smaller.",
      points: [
        "XS – XXL in standard sizing",
        "Free size exchange within 7 days",
        "Prefer your own measurements? Silai stitches it to order",
      ],
    },
  },
  {
    slug: "/luxury-pret",
    nav: "Luxury Pret",
    title: "Luxury Pret",
    breadcrumb: ["Woman", "Luxury Pret"],
    eyebrow: "Occasion wear",
    intro:
      "Tissue, organza, chiffon and chikankari, finished by hand and sold with the dupatta. The pieces we make for weddings, Eid and everything worth dressing for.",
    meta: {
      title: "Luxury Pret",
      description:
        "Hand-finished FEEZEE occasion wear in tissue, organza and chikankari, dupatta included.",
    },
    banner: "hero/look-02.jpg",
    note: {
      title: "How these are made",
      body: "Luxury Pret is embroidered on the frame before it is cut, which is why the panels line up across a seam. Each suit passes a hand finish for the lace, the tassels and the dupatta edge.",
      points: [
        "Hand-finished lace and pallu",
        "Dupatta included on every 3-piece",
        "Dry clean only",
      ],
    },
  },
  {
    slug: "/printed-lawn",
    nav: "Printed Lawn",
    title: "Printed Lawn",
    breadcrumb: ["Woman", "Printed Lawn"],
    eyebrow: "Summer weight",
    intro:
      "Block prints, ajrak panels and heritage motifs on lawn, cambric and viscose — the cloth that survives a Karachi August.",
    meta: {
      title: "Printed Lawn",
      description:
        "FEEZEE block-printed lawn, cambric and viscose — breathable summer suits and co-ords.",
    },
    banner: "hero/look-05.jpg",
    note: {
      title: "About the cloth",
      body: "Lawn and cambric are woven fine and finished soft, so the print sits in the cloth rather than on it. Ajrak panels are block-printed in Sindh and washed twice before they are cut.",
      points: [
        "Colour-fast after the second wash",
        "Machine wash cold, dry in shade",
        "Prints run in limited lots — rarely restocked",
      ],
    },
  },
  {
    slug: "/sale",
    nav: "Sale",
    title: "Sale",
    breadcrumb: ["Woman", "Sale"],
    eyebrow: "Up to 35% off",
    intro:
      "Last season's pieces, marked down while they last. Nothing here is in New In, and once a size is gone it is gone.",
    meta: {
      title: "Sale",
      description:
        "FEEZEE sale — last season's kurtas, suits and co-ords at up to 35% off while stock lasts.",
    },
    banner: "hero/look-08.jpg",
    tone: "sale",
    note: {
      title: "Before you order",
      body: "Sale pieces are the end of a lot, so sizes are whatever is left on the rail. They ship on the same schedule as everything else and carry the same stitching guarantee.",
      points: [
        "Final sale — exchange only, no returns",
        "Discount already applied, no code needed",
        "Free delivery over Rs 5,000 still applies",
      ],
    },
  },
];

const bySlug = new Map(shopPages.map((page) => [page.slug, page]));

/** The page at `slug`, or undefined. */
export function shopPage(slug: string): ShopPage | undefined {
  return bySlug.get(slug);
}

/**
 * The garments a page shows. New In is the three lines together; every other
 * page is the single line that shares its name.
 */
export function productsForPage(page: ShopPage): Product[] {
  if (page.slug === "/new-in") return newInProducts();
  return productsInCollection(page.nav as Collection);
}

/** The three line pages, for the "shop the lines" strip on New In. */
export const linePages = shopPages.filter((page) =>
  (NEW_IN_COLLECTIONS as readonly string[]).includes(page.nav),
);

/** The page that holds a line, for links that start from a garment. */
export function collectionHref(collection: Collection): string {
  return shopPages.find((page) => page.nav === collection)?.slug ?? "/new-in";
}
