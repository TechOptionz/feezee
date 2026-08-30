import type { Product } from "@/content/products";

/**
 * Everything a garment's own page says that a grid never has to.
 *
 * A card sells on a photograph and a price. A product page has to answer the
 * questions that stop an order: what is actually in the box, what the colour is
 * called, whether it comes in a size that fits, and how to wash it. That copy
 * lives here rather than in `products.ts`, so the catalogue stays a list of
 * garments and this stays a list of answers about them.
 */

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

/**
 * What a size chip says. `low` is the last few of a size — the one piece of
 * stock information worth putting in front of someone, because it is the only
 * one that changes what they do next.
 */
export type SizeState = "in" | "low" | "out";

/**
 * The rail, size by size.
 *
 * Sale pieces are the end of a lot, so most of them are down to the middle
 * sizes; everything else runs full unless a size has been eaten by a good week.
 * A garment with no entry here is in stock in every size.
 */
const STOCK: Record<number, Partial<Record<Size, SizeState>>> = {
  1: { XS: "low", XXL: "out" },
  2: { XS: "out", S: "low", XL: "out", XXL: "out" },
  3: { M: "low" },
  4: { XS: "out", XXL: "low" },
  5: { S: "low", XXL: "out" },
  7: { XS: "out", S: "out", L: "low", XL: "out", XXL: "out" },
  8: { XXL: "low" },
  9: { XS: "low", S: "low", XXL: "out" },
  11: { M: "low", XXL: "out" },
  12: { XS: "out", S: "out", M: "low", XXL: "out" },
  14: { S: "low" },
  15: { XS: "out", XXL: "low" },
  16: { XS: "out", S: "low", XL: "out", XXL: "out" },
  17: { XS: "low", XXL: "out" },
  18: { L: "low" },
  19: { XXL: "out" },
  20: { XS: "low" },
  21: { XS: "out", M: "low", XL: "out", XXL: "out" },
  22: { S: "out", M: "out", L: "low", XXL: "out" },
};

/** One size chip: the label, and whether it can be chosen. */
export type SizeOption = { size: Size; state: SizeState };

/** Every size for a garment, in chart order. */
export function sizeOptions(product: Product): SizeOption[] {
  const stock = STOCK[product.id] ?? {};
  return SIZES.map((size) => ({ size, state: stock[size] ?? "in" }));
}

/**
 * The size a page opens on: the first one that can actually be added to a bag,
 * which is what keeps the button live on arrival. Null when the piece is gone
 * altogether, and the page says so instead.
 */
export function defaultSize(product: Product): Size | null {
  return sizeOptions(product).find((option) => option.state !== "out")?.size ?? null;
}

/** One garment inside the piece — a shirt, a trouser, a dupatta. */
export type Component = { name: string; colour: string; fabric: string };

export type ProductDetail = {
  /** The colour as we would say it on the phone, not as a hex value. */
  colour: string;
  /** The cut, in the trade's words. Printed above the components. */
  cut: string;
  /** What is in the box, top down. */
  components: Component[];
  /** The DESCRIPTION tab: why the piece is what it is. */
  description: string;
  /** How to keep it. One line, because nobody reads two. */
  care: string;
};

/**
 * Per-garment copy, keyed by catalogue id so a rename never orphans it.
 *
 * The components are the part worth keeping accurate: a three-piece that lists
 * its dupatta separately is the difference between "3 pc" and knowing whether
 * that dupatta is organza or net.
 */
const DETAILS: Record<number, ProductDetail> = {
  1: {
    colour: "Sage Green",
    cut: "Straight shirt with a flared trouser",
    components: [
      { name: "Shirt", colour: "Sage Green", fabric: "Tissue" },
      { name: "Trouser", colour: "Sage Green", fabric: "Cambric" },
      { name: "Dupatta", colour: "Sage Green", fabric: "Tissue" },
    ],
    description:
      "Tissue holds light the way no other summer cloth does, which is why this suit reads differently indoors and out. The shirt is cut straight and finished with a hand-rolled hem; the dupatta is the same tissue, edged rather than bordered, so it falls without weight.",
    care: "Dry clean only. Store folded, with the dupatta on top.",
  },
  2: {
    colour: "Rose Pink",
    cut: "Straight shirt with a slim trouser",
    components: [
      { name: "Shirt", colour: "Rose Pink", fabric: "Embroidered Lawn" },
      { name: "Trouser", colour: "Rose Pink", fabric: "Cambric" },
      { name: "Dupatta", colour: "Rose Pink", fabric: "Chiffon" },
    ],
    description:
      "A last-season rose that sold through twice before it was marked down. The front panel is embroidered on the frame before the shirt is cut, so the motif runs unbroken across the placket, and the chiffon dupatta carries the same thread on all four edges.",
    care: "Dry clean recommended. Cold hand wash separately if you must.",
  },
  3: {
    colour: "Ivory",
    cut: "Straight shirt with a lace hem and a slim trouser",
    components: [
      { name: "Shirt", colour: "Ivory", fabric: "Printed Lawn" },
      { name: "Trouser", colour: "Ivory", fabric: "Cambric" },
      { name: "Dupatta", colour: "Ivory", fabric: "Lawn with cotton lace" },
    ],
    description:
      "The piece we restock more often than anything else on the rail. Printed lawn on an ivory ground, finished with a cotton lace at the hem and along the dupatta — the kind of finish that reads as occasion wear at ten in the morning.",
    care: "Machine wash cold on a gentle cycle. Dry in shade.",
  },
  4: {
    colour: "Antique Gold",
    cut: "Boxy shirt with a straight trouser",
    components: [
      { name: "Shirt", colour: "Antique Gold", fabric: "Raw Silk" },
      { name: "Trouser", colour: "Antique Gold", fabric: "Raw Silk" },
    ],
    description:
      "Raw silk in an antique gold that goes warmer under lamplight. Both halves are cut from the same bolt, so the co-ord holds as one colour — the thing that separates a set from two pieces that happen to match.",
    care: "Dry clean only. Press on the reverse, with a cloth between.",
  },
  5: {
    colour: "Maroon",
    cut: "Straight kurta with a slim trouser",
    components: [
      { name: "Kurta", colour: "Maroon", fabric: "Raw Silk" },
      { name: "Trouser", colour: "Maroon", fabric: "Cambric" },
    ],
    description:
      "Zari worked in a fine grid across maroon raw silk, so the shirt catches light in lines rather than in patches. Cut long, sleeves full, and finished with a covered placket that keeps the front clean.",
    care: "Dry clean only. Keep perfume away from the zari.",
  },
  6: {
    colour: "Rust Multi",
    cut: "Straight kurta, sold on its own",
    components: [{ name: "Kurta", colour: "Rust Multi", fabric: "Printed Viscose" }],
    description:
      "A patola grid redrawn small enough to wear on an ordinary day. Viscose falls heavier than lawn and creases less, which is what makes this the kurta that survives a full working day and the drive home.",
    care: "Machine wash cold. Do not tumble dry.",
  },
  7: {
    colour: "Black & Ivory",
    cut: "Straight shirt with a slim trouser",
    components: [
      { name: "Shirt", colour: "Black & Ivory", fabric: "Printed Cambric" },
      { name: "Trouser", colour: "Black", fabric: "Cambric" },
      { name: "Dupatta", colour: "Black & Ivory", fabric: "Printed Chiffon" },
    ],
    description:
      "An ikat drawn by hand and printed on cambric, in the two colours that never date. The dupatta prints the same motif at a larger scale, so the two do not compete when they are worn together.",
    care: "Machine wash cold, inside out. Dry in shade.",
  },
  8: {
    colour: "Turquoise",
    cut: "A-line shirt with a straight trouser",
    components: [
      { name: "Shirt", colour: "Turquoise", fabric: "Embroidered Grip" },
      { name: "Trouser", colour: "Turquoise", fabric: "Cambric" },
      { name: "Dupatta", colour: "Turquoise", fabric: "Organza" },
    ],
    description:
      "Grip takes embroidery without puckering, which is why the lace on this shirt sits flat across the yoke instead of gathering. Stitched in our standard sizing and shipped the same week it is ordered.",
    care: "Dry clean recommended. Cool iron on the reverse.",
  },
  9: {
    colour: "Sea Green",
    cut: "Full-flare anarkali with a churidar",
    components: [
      { name: "Anarkali", colour: "Sea Green", fabric: "Chiffon over silk" },
      { name: "Churidar", colour: "Sea Green", fabric: "Raw Silk" },
    ],
    description:
      "Six panels of chiffon over a silk lining, cut to fall from the yoke rather than the waist. It is the most cloth of anything we make, and the reason it walks the way it does.",
    care: "Dry clean only. Hang on a padded hanger — never fold.",
  },
  10: {
    colour: "Indigo & Madder",
    cut: "Straight shirt with a wide trouser",
    components: [
      { name: "Shirt", colour: "Indigo & Madder", fabric: "Block-printed Cotton" },
      { name: "Dupatta", colour: "Indigo & Madder", fabric: "Ajrak Cotton" },
    ],
    description:
      "Block-printed in Sindh in the old sequence — indigo first, madder over it — and washed twice before it is cut, so the colour that reaches you is the colour it will stay.",
    care: "Hand wash cold for the first three washes. Dry in shade.",
  },
  11: {
    colour: "Teal",
    cut: "Straight shirt with a slim trouser",
    components: [
      { name: "Shirt", colour: "Teal", fabric: "Embroidered Grip" },
      { name: "Trouser", colour: "Teal", fabric: "Cambric" },
      { name: "Dupatta", colour: "Teal", fabric: "Organza" },
    ],
    description:
      "Embroidered across the full front in a tone close to the ground, so the work shows in texture before it shows in colour. The organza dupatta is left plain but for its edge, which keeps the suit from tipping into formal.",
    care: "Dry clean only. Steam the organza rather than pressing it.",
  },
  12: {
    colour: "Ivory & Green",
    cut: "Straight kurta, sold on its own",
    components: [
      { name: "Kurta", colour: "Ivory & Green", fabric: "Printed Cotton Silk" },
    ],
    description:
      "A palm print at full scale on cotton silk — the cloth that gives lawn's coolness a little more fall. Marked down at the end of the season rather than because anything is wrong with it.",
    care: "Machine wash cold on a gentle cycle. Cool iron.",
  },
  14: {
    colour: "Black",
    cut: "Straight kurta with a covered placket",
    components: [{ name: "Kurta", colour: "Black", fabric: "Embroidered Lawn" }],
    description:
      "Black on black: the embroidery is worked in the same thread colour as the cloth, so it carries the light rather than the eye. The one kurta on the rail that goes anywhere without being asked about.",
    care: "Cold hand wash separately. Do not bleach.",
  },
  15: {
    colour: "Ivory",
    cut: "Straight kurta with a deep side slit",
    components: [
      { name: "Kurta", colour: "Ivory", fabric: "Self-embroidered Grip" },
    ],
    description:
      "Self-embroidery on ivory grip — a tone-on-tone vine that only appears close up. Cut long, and finished so it wears over a trouser or a straight shalwar without looking like it was made for one of them.",
    care: "Dry clean recommended. Cool iron on the reverse.",
  },
  16: {
    colour: "Pearl Grey",
    cut: "Straight kurta, sold on its own",
    components: [
      { name: "Kurta", colour: "Pearl Grey", fabric: "Embroidered Cambric" },
    ],
    description:
      "Small blossoms embroidered across a pearl grey cambric, spaced so the ground still reads as grey rather than as pattern. The quietest piece on the sale rail and, most weeks, the first to go.",
    care: "Machine wash cold, inside out. Dry flat.",
  },
  17: {
    colour: "Black & Gold",
    cut: "Straight shirt with a flared trouser",
    components: [
      { name: "Shirt", colour: "Black", fabric: "Embroidered Lawn" },
      { name: "Trouser", colour: "Black", fabric: "Cambric" },
      { name: "Dupatta", colour: "Black", fabric: "Net with gold work" },
    ],
    description:
      "Our occasion black: gold worked on the yoke and the sleeve edge, and a net dupatta carrying the same thread along a scalloped border. The panels are embroidered before cutting, so the motif runs across the side seam without a break.",
    care: "Dry clean only. Store in the muslin bag it arrives in.",
  },
  18: {
    colour: "Mint",
    cut: "Straight shirt with a slim trouser",
    components: [
      { name: "Shirt", colour: "Mint", fabric: "Chikankari Lawn" },
      { name: "Trouser", colour: "Mint", fabric: "Cambric" },
      { name: "Dupatta", colour: "Mint", fabric: "Organza" },
    ],
    description:
      "Chikankari worked by hand, which is why no two shirts are stitch for stitch alike. Six weeks of needlework on a lawn light enough to wear through a Karachi afternoon, finished with an organza dupatta.",
    care: "Hand wash cold, or dry clean. Never wring.",
  },
  19: {
    colour: "Rani Pink",
    cut: "Straight kurta with a bracelet sleeve",
    components: [{ name: "Kurta", colour: "Rani Pink", fabric: "Raw Silk" }],
    description:
      "Zari dotted across raw silk at an inch apart — enough to catch a room's light, not enough to make it a formal. Cut with a bracelet sleeve, so it wears with bangles rather than around them.",
    care: "Dry clean only. Press on the reverse, with a cloth between.",
  },
  20: {
    colour: "Black Ajrak",
    cut: "Boxy shirt with a wide trouser",
    components: [
      { name: "Shirt", colour: "Black Ajrak", fabric: "Ajrak Cotton" },
      { name: "Dupatta", colour: "Black Ajrak", fabric: "Ajrak Cotton" },
    ],
    description:
      "The ajrak we print in black rather than madder, on a cotton washed until it drapes. Block by block, the border is registered by hand — look along the hem and you can see where one block ends and the next begins.",
    care: "Hand wash cold for the first three washes. Dry in shade.",
  },
  21: {
    colour: "Black & Ivory",
    cut: "Straight shirt with a straight trouser",
    components: [
      { name: "Shirt", colour: "Black & Ivory", fabric: "Block-printed Cambric" },
      { name: "Trouser", colour: "Ivory", fabric: "Cambric" },
    ],
    description:
      "One block, two colours, nothing else. The set is printed as a set, so the scale of the motif steps down on the trouser and the two halves sit together instead of arguing.",
    care: "Machine wash cold, inside out. Cool iron.",
  },
  22: {
    colour: "Blush Rose",
    cut: "Straight kurta, sold on its own",
    components: [{ name: "Kurta", colour: "Blush Rose", fabric: "Printed Lawn" }],
    description:
      "A blush lawn print at the smallest scale we run, which is what makes it read as a texture from across a room. The last of the season's lawn, at the last of the season's prices.",
    care: "Machine wash cold. Dry in shade.",
  },
};

/**
 * A garment's page copy. The fallback is derived from the catalogue rather than
 * left blank, so a garment added to `products.ts` without an entry here still
 * has a page that answers the basic questions.
 */
export function productDetail(product: Product): ProductDetail {
  const written = DETAILS[product.id];
  if (written) return written;

  return {
    colour: "As photographed",
    cut: `${product.type.replace(/s$/, "")} in our house block`,
    components: [
      { name: "Shirt", colour: "As photographed", fabric: product.fabricFamily },
    ],
    description: `${product.fabric}, cut and finished in our own studio and stitched in the sizing on this page. It can also be cut to your own measurements through Silai.`,
    care: "Cold wash separately, or dry clean. Dry in shade.",
  };
}

/** The line that closes the DETAILS tab, on every garment. */
export const COLOUR_NOTE =
  "Note: the actual colour of the garment may vary slightly from the image.";

/**
 * The house size chart, in inches. One table for the whole shop — every piece
 * is cut on the same block, which is the point of having a block at all.
 */
export const sizeGuide = {
  columns: ["Size", "Bust", "Waist", "Hip", "Shirt", "Trouser"],
  rows: [
    ["XS", "34", "28", "36", "40", "38"],
    ["S", "36", "30", "38", "40", "38.5"],
    ["M", "38", "32", "40", "41", "39"],
    ["L", "40", "34", "42", "41", "39.5"],
    ["XL", "42", "36", "44", "42", "40"],
    ["XXL", "44", "38", "46", "42", "40.5"],
  ],
  notes: [
    "Measurements are of the body, not the garment — every piece carries two to three inches of ease over the numbers above.",
    "Between two sizes? Take the larger for the shirt and the smaller for the trouser; we cut both from one order.",
    "None of these your numbers? Silai stitches any design on this site to your own measurements.",
  ],
} as const;
