export type Product = {
  id: number;
  name: string;
  fabric: string;
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
 * `public/img/` holds several shots of the same piece — a hanger shot, a studio
 * shot and a shoot frame — plus a few byte-identical copies under different
 * names (p01/p06, p02/p07, p03/p05/p10, p04/p08) and four WhatsApp screenshots
 * (p04, p08, p18, p21) that are not usable as product photography. Picking the
 * file here rather than in the sections is what keeps a piece from turning up
 * twice in one grid wearing two different names.
 *
 * Unused alternates, for reference:
 *   p01/p06/p15 → id 1   p02/p07 → id 2   p03/p05/p10/p18 → id 3
 *   p04/p08 → id 4       p09 → id 5       p12 → id 7
 *   p14/p19 → id 9       p16/p17 → id 10  p20/p24 → id 11
 *   p21 → id 12          p26 → id 16      p27 → id 17
 *   p28 → id 18          p30 → id 20      p31 → id 21
 */
export const products: Product[] = [
  {
    id: 1,
    name: "Sabz Tissue Suit",
    fabric: "Sage tissue, 3 pc",
    pkr: 15900,
    img: "suit-sage-tissue.jpg",
    badge: { label: "New", tone: "gold" },
  },
  { id: 2, name: "Gulaab Rose Pret", fabric: "Embroidered lawn, 3 pc", pkr: 12400, img: "suit-rose-pink.jpg" },
  {
    id: 3,
    name: "Bahaar Lace Suit",
    fabric: "Printed lawn with lace, 3 pc",
    pkr: 11800,
    img: "dupatta-ivory-lace.jpg",
    badge: { label: "Best Seller", tone: "wine" },
  },
  { id: 4, name: "Zarrin Gold Co-ord", fabric: "Raw silk, 2 pc", pkr: 11500, img: "coord-gold-silk.png" },
  { id: 5, name: "Shirin Maroon Zari", fabric: "Maroon raw silk, 2 pc", pkr: 8950, img: "kurta-maroon-zari.png" },
  { id: 6, name: "Laila Patola Print", fabric: "Printed viscose", pkr: 7250, img: "p11.jpg" },
  { id: 7, name: "Siyah Ikat Suit", fabric: "Printed cambric, 3 pc", pkr: 9450, img: "dupatta-printed-chiffon.jpg" },
  { id: 8, name: "Feroza Lace Pret", fabric: "Embroidered grip, 3 pc", pkr: 13200, img: "p13.jpg" },
  {
    id: 9,
    name: "Zumurrud Anarkali",
    fabric: "Chiffon anarkali, 2 pc",
    pkr: 18500,
    img: "suit-sea-green-anarkali.jpg",
    badge: { label: "New", tone: "gold" },
  },
  { id: 10, name: "Ajrak Co-ord Set", fabric: "Block-printed cotton, 2 pc", pkr: 7450, img: "coord-ajrak.jpg" },
  { id: 11, name: "Neelam Teal Suit", fabric: "Embroidered grip, 3 pc", pkr: 13800, img: "suit-teal-embroidered.jpg" },
  { id: 12, name: "Gulbahar Palm Kurta", fabric: "Printed cotton silk", pkr: 8600, img: "kurta-ivory-palm.jpg" },
  {
    id: 13,
    name: "Gulrang Poppy Print",
    fabric: "Block-printed cambric",
    pkr: 5450,
    wasPkr: 6800,
    img: "p22.jpg",
    badge: { label: "Sale", tone: "wine" },
  },
  { id: 14, name: "Noor Midnight Kurta", fabric: "Black embroidered lawn", pkr: 9200, img: "p23.jpg" },
  { id: 15, name: "Sahar Ivory Pret", fabric: "Self-embroidered grip", pkr: 7900, img: "p25.jpg" },
  { id: 16, name: "Sadaf Grey Blossom", fabric: "Embroidered cambric", pkr: 5650, img: "kurta-grey-blossom.jpg" },
  {
    id: 17,
    name: "Shab Noir Luxury Suit",
    fabric: "Embroidered lawn, 3 pc",
    pkr: 16900,
    img: "dupatta-black-net.jpg",
    badge: { label: "New", tone: "gold" },
  },
  { id: 18, name: "Mehr Mint Chikankari", fabric: "Chikankari lawn, 3 pc", pkr: 14500, img: "dupatta-mint-organza.jpg" },
  { id: 19, name: "Rani Zari Kurta", fabric: "Zari-dotted raw silk", pkr: 8450, img: "p29.jpg" },
  {
    id: 20,
    name: "Kaali Ajrak Co-ord",
    fabric: "Ajrak cotton, 2 pc",
    pkr: 7850,
    img: "coord-black-ajrak.jpg",
    badge: { label: "Best Seller", tone: "wine" },
  },
  { id: 21, name: "Monochrome Block Co-ord", fabric: "Block-printed cambric, 2 pc", pkr: 6950, img: "coord-monochrome.jpg" },
  { id: 22, name: "Anaya Rose Lawn", fabric: "Printed lawn", pkr: 4850, img: "kurta-rose-print.jpg" },
];

/** Every product keyed by id, so a group only has to carry the ids it shows. */
const byId = new Map(products.map((p) => [p.id, p]));

/** The products of `ids`, in the order given. Unknown ids are skipped. */
export function productsByIds(ids: readonly number[]): Product[] {
  return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
}

/**
 * "New Arrivals" is split the same way the shop is: a drop per line, each with
 * its own copy and its own four looks. The group names double as the tabs under
 * the section heading, so adding a line here adds a tab.
 *
 * The four ids in a group are four different garments, and no two of them share
 * a colour story — a grid of four ivories reads as a mistake even when it isn't.
 */
export type NewArrivalGroup = {
  name: string;
  /** Pieces in the line on the shop, not just the four shown here. */
  count: number;
  blurb: string;
  href: string;
  /** The four looks the section puts on screen for this line. */
  productIds: number[];
};

export const newArrivalGroups: NewArrivalGroup[] = [
  {
    name: "Printed Lawn",
    count: 46,
    blurb:
      "Everyday prints on breathable lawn and cambric — block motifs, heritage panels and a colour story cut for long summers.",
    href: "#new",
    productIds: [6, 13, 21, 10],
  },
  {
    name: "Luxury Pret",
    count: 24,
    blurb:
      "Tissue, organza and chikankari finished by hand. Occasion pieces that arrive ready to wear, dupatta included.",
    href: "#new",
    productIds: [1, 3, 17, 18],
  },
  {
    name: "Ready to Wear",
    count: 38,
    blurb:
      "Stitched in our standard sizing and shipped the same week — the kurtas and pret we keep on the rail year round.",
    href: "#new",
    productIds: [5, 15, 8, 22],
  },
];

/**
 * "Shop by Category" tabs. The four words in the section header are the filter:
 * picking one swaps the four looks below it, so each tab carries its own set.
 * Looks are grouped by what the photo actually shows — a solo shirt under
 * Kurtas, a shirt shot with its dupatta under Suits or Dupattas, a full
 * shirt-and-trouser set under Co-ords. All sixteen ids are distinct: switching
 * tabs should never bring back a piece you just looked at.
 */
export type CategoryTab = {
  name: string;
  /** Where "View all" goes for this tab. */
  href: string;
  productIds: number[];
};

export const categoryTabs: CategoryTab[] = [
  { name: "Kurtas", href: "#new", productIds: [12, 16, 19, 14] },
  { name: "Suits", href: "#new", productIds: [1, 2, 11, 9] },
  { name: "Co-ords", href: "#new", productIds: [10, 21, 20, 4] },
  { name: "Dupattas", href: "#new", productIds: [3, 18, 17, 7] },
];

/**
 * Lookbook rail. These are the alternate frames of pieces the grids show from a
 * different angle, so the rail reads as a shoot rather than a repeat of the shop.
 */
export const lookbook: string[] = [
  "p15.jpg",
  "p24.jpg",
  "p26.jpg",
  "p31.jpg",
  "p16.jpg",
  "p03.jpg",
];
