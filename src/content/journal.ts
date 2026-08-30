/**
 * The FEEZEE journal.
 *
 * Three pieces of writing that answer what the shop pages cannot: how to keep
 * a hand-embroidered lawn alive past one summer, whether to buy a size or send
 * measurements, and what "ajrak" actually means on a label. They close a
 * garment's page because that is where the question comes up — the point at
 * which someone is deciding, not browsing.
 */

export type Article = {
  /** Path segment: `/journal/<slug>`. */
  slug: string;
  title: string;
  /** The word above the title, and the sorting the reader does in their head. */
  category: "Care" | "Guides" | "Craft";
  /** Standfirst, printed on the card and under the title on the page. */
  standfirst: string;
  /** Written date, absolute so it never needs recalculating. */
  date: string;
  readingMinutes: number;
  image: string;
  /** Body paragraphs. A string is prose; a `{ heading }` opens a section. */
  body: (string | { heading: string })[];
};

export const articles: Article[] = [
  {
    slug: "keeping-hand-embroidered-lawn",
    title: "Keeping hand-embroidered lawn",
    category: "Care",
    standfirst:
      "Most embroidered suits are not worn out — they are washed out. Six habits that keep a piece looking the way it did the week it arrived.",
    date: "12 August 2026",
    readingMinutes: 5,
    image: "hero/look-05.jpg",
    body: [
      "An embroidered lawn suit is two things stitched together: a cloth woven to be light, and a thread laid on top of it that is not. Nearly every way a suit is ruined comes from treating those two as one material.",
      { heading: "Wash it cold, and wash it alone" },
      "Warm water opens the weave and loosens the tension the embroidery was worked at. Cold water, a mild detergent and a short cycle will lift a season of Karachi dust without touching the thread. Wash the suit on its own for the first three washes — a zip on a pair of jeans will find embroidery across a whole drum.",
      "Turn the shirt inside out before it goes in. The friction of a machine falls on whatever faces outward, and that should be the ground cloth rather than the work.",
      { heading: "Never wring, never hang wet" },
      "Wringing twists the ground under the thread and leaves puckers that no iron takes out. Press the water out between two towels instead, then dry the piece flat, or over a rail with the weight spread along its length. A wet shirt on a wire hanger will grow shoulders it was never cut with.",
      { heading: "Dry in shade" },
      "Sunlight is the fastest way to lose a colour, and it takes the dyed thread before it takes the cloth. Shade, and a breeze, and an afternoon.",
      { heading: "Iron on the reverse" },
      "Set the iron to cotton, turn the shirt inside out and press from the back, with a cotton cloth between the iron and any raised work. Zari and sequins will flatten permanently under direct heat — once they have lost their angle, they have lost the light.",
      { heading: "Store it folded, not hung" },
      "A heavy three-piece hung for a season stretches at the shoulder. Fold it with the dupatta on top, in cotton or muslin rather than plastic, which traps moisture against the thread. The muslin bag a Luxury Pret suit arrives in is there for exactly this.",
      { heading: "When in doubt, dry clean" },
      "Tissue, organza, net and anything with zari should go to a cleaner rather than a machine — the label on each product page says which. It costs less than the suit does.",
    ],
  },
  {
    slug: "ready-to-wear-or-made-to-measure",
    title: "Ready to wear, or cut to your measurements?",
    category: "Guides",
    standfirst:
      "The same design, two ways to buy it. What each one actually gets you, and how to tell which one you want before you order.",
    date: "29 July 2026",
    readingMinutes: 4,
    image: "hero/look-07.jpg",
    body: [
      "Every design on this site can be bought two ways: stitched in our standard sizing and shipped this week, or cut to your own measurements through Silai. Neither is the better one. They answer different questions.",
      { heading: "Standard sizing is a block, not a guess" },
      "Our XS to XXL run on one house block — a relaxed shoulder, a straight shirt, a full-length sleeve — with two to three inches of ease over the body measurements in the size chart. If your bust, waist and hip land within one size of each other, the block will fit you the way it fits the photograph.",
      "It also fits a deadline. Ready to Wear leaves the studio within 48 hours because the piece is already made; nothing is waiting on a tailor's table.",
      { heading: "Measurements are for the body between two sizes" },
      "Most people are not one size. A 38 bust with a 32 waist, a longer arm than the block allows, a shirt length that has to clear a particular trouser — these are the cases where a standard size can be made to work but will never be right. Silai is for those, and for anyone who has already had to have every shirt they own altered.",
      "It takes seven to fourteen days for most orders, and the alterations after it are free, for as long as you own the piece.",
      { heading: "How to decide in one minute" },
      "Take the size chart. If one row is within an inch of you across bust, waist and hip, order that size and let the ease do the rest. If two rows are fighting over you, send measurements — we cut the shirt to the larger and the trouser to the smaller from a single order.",
      { heading: "If you cannot measure yourself" },
      "Post us a shirt that already fits you well. We copy it seam for seam and send it back with the new piece. It is the most accurate set of measurements anyone can give us, because it is not a set of numbers at all.",
    ],
  },
  {
    slug: "ajrak-two-colours-sixteen-steps",
    title: "Ajrak: two colours, sixteen steps",
    category: "Craft",
    standfirst:
      "Why a block-printed ajrak costs what it does, takes three weeks to make, and gets better after it has been washed.",
    date: "4 July 2026",
    readingMinutes: 6,
    image: "hero/look-09.jpg",
    body: [
      "Ajrak is printed in Sindh the way it has been printed for centuries: with carved wooden blocks, in a sequence of resists, dyes and washes that runs to sixteen steps and takes the better part of three weeks. Almost none of that time is printing.",
      { heading: "The cloth is prepared before it is touched" },
      "Cotton arrives with the mill's finish still on it. It is washed, beaten and steeped so that it will take dye evenly — a step that decides everything after it, and one a printed imitation skips entirely.",
      { heading: "Resist first, colour second" },
      "The pattern is not painted on. A lime-and-gum resist is printed where the cloth is to stay white, and a second resist where it is to stay pale. Only then does the whole length go into indigo, and later into madder. The design appears by being protected from colour rather than given it.",
      "This is why an ajrak reads the same on both faces. The dye goes through the cloth, not onto it.",
      { heading: "Indigo, then madder" },
      "Indigo is a vat dye: the cloth comes out green and turns blue in the air, in front of you. Madder is boiled, and takes its red from the root. The two colours cannot be laid in the other order, which is the reason every true ajrak sits in the same family of blue and rust — and the reason a black ajrak, like the one on our rail, is a deliberate departure rather than a default.",
      { heading: "Washed twice before it is cut" },
      "Between and after the dye baths the cloth is washed in running water and dried in the sun. We wash ours twice more before it reaches the cutting table, so the colour that arrives with you is the colour it will keep. Hand wash it cold for its first three washes and it will go on softening for years.",
      { heading: "What to look for" },
      "Hold a hem up to the light and follow the border. You will find the point where one block ended and the next was set down — a half-millimetre step, registered by eye. That step is how you tell a block print from a photograph of one.",
    ],
  },
];

const bySlug = new Map(articles.map((article) => [article.slug, article]));

/** The article at `slug`, or undefined — an unknown slug is a 404. */
export function articleBySlug(slug: string): Article | undefined {
  return bySlug.get(slug);
}

/** Where an article card points. */
export function articleHref(article: Article): string {
  return `/journal/${article.slug}`;
}

/** The articles to feature, newest first, optionally without the one being read. */
export function featuredArticles(exceptSlug?: string): Article[] {
  return articles.filter((article) => article.slug !== exceptSlug);
}
