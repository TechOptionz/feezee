import {
  categoryTabs,
  newArrivalGroups,
  products,
  productsByIds,
  productsInCollection,
} from "@/content/products";
import { contact, storeConfig } from "@/lib/site";

/**
 * The assistant's script.
 *
 * There is no model behind the chat — every reply it can give is written here.
 * Facts the page already states (prices, category names, drop sizes, the free
 * shipping threshold) are read back out of the same content modules the
 * sections render from, so a price is never written down twice.
 */

/** Formats an AED amount in the visitor's chosen currency. */
export type PriceFormatter = (aed: number) => string;

export type ChatTopic = {
  id: string;
  /** Chip label, and the message shown as the visitor's own question. */
  question: string;
  /** Words that route a typed question to this topic. */
  keywords: string[];
  /** The reply, one string per paragraph. */
  lines: (price: PriceFormatter) => string[];
  /** Looks listed under the reply. */
  productIds?: number[];
  /** Topics offered as chips after the reply. */
  followUps?: string[];
};

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** "AED 64 – AED 118" across the given pieces. */
function range(ids: readonly number[], price: PriceFormatter) {
  const amounts = productsByIds(ids).map((p) => p.aed);
  return `${price(Math.min(...amounts))} – ${price(Math.max(...amounts))}`;
}

/*
 * What the catalogue actually costs, read off the catalogue. The figures that
 * used to sit in the "how much" reply were rupee-era numbers formatted as
 * dirhams, which is exactly the kind of thing that only stays wrong while it
 * is written down twice.
 */
const catalogueAed = products.map((p) => p.aed);
const pretAed = productsInCollection("Luxury Pret").map((p) => p.aed);

const saleIds = products.filter((p) => p.wasAed).map((p) => p.id);
const bestSellerIds = products.filter((p) => p.badge?.label === "Best Seller").map((p) => p.id);
const newIds = products.filter((p) => p.badge?.label === "New").map((p) => p.id);
/** How many pieces a line actually holds — the grid and the reply agree. */
const lineSize = (name: (typeof newArrivalGroups)[number]["name"]) =>
  productsInCollection(name).length;

const totalPieces = newArrivalGroups.reduce((n, g) => n + lineSize(g.name), 0);

/*
 * What each tab of "Shop by Category" actually holds. The tab names and the
 * looks come from `categoryTabs`; only the sentence describing the cut lives
 * here, because nothing else on the page says it.
 */
const CATEGORY_NOTE: Record<string, string> = {
  Kurtas: "single stitched shirts, worn with your own trousers or tights",
  Suits: "shirt, trouser and dupatta as one article, in 2 pc and 3 pc sets",
  "Co-ords": "matched shirt-and-trouser sets, mostly block prints and raw silk",
  Dupattas: "dupattas on their own, to finish a kurta you already own",
};

const categoryTopics: ChatTopic[] = categoryTabs.map((tab) => ({
  id: `category-${slug(tab.name)}`,
  question: tab.name,
  keywords: [tab.name.toLowerCase(), slug(tab.name)],
  lines: (price) => [
    `${tab.name} — ${CATEGORY_NOTE[tab.name]}.`,
    `On the rail right now, ${range(tab.productIds, price)}:`,
  ],
  productIds: tab.productIds,
  followUps: ["categories", "sizes", "silai", "shipping"],
}));

const lineTopics: ChatTopic[] = newArrivalGroups.map((group) => ({
  id: `line-${slug(group.name)}`,
  question: group.name,
  keywords: [group.name.toLowerCase(), slug(group.name)],
  lines: (price) => [
    group.blurb,
    `${lineSize(group.name)} pieces in the line, ${range(group.productIds, price)}. Four of them:`,
  ],
  productIds: group.productIds,
  followUps: ["new-in", "article-pieces", "sizes", "shipping"],
}));

const staticTopics: ChatTopic[] = [
  {
    id: "categories",
    question: "Shop by category",
    keywords: ["category", "categories", "browse", "collection", "range", "sell"],
    lines: () => [
      `We stitch four kinds of article: ${categoryTabs.map((t) => t.name).join(", ")}.`,
      "Which one would you like to see?",
    ],
    followUps: categoryTopics.map((t) => t.id),
  },
  {
    id: "new-in",
    question: "What's new in",
    keywords: ["new", "arrival", "arrivals", "latest", "drop", "recent"],
    lines: () => [
      `${totalPieces} pieces across three lines: ${newArrivalGroups
        .map((g) => `${g.name} (${lineSize(g.name)})`)
        .join(", ")}.`,
      "Pick a line and I'll show you what's in it.",
    ],
    productIds: newIds.slice(0, 4),
    followUps: [...lineTopics.map((t) => t.id), "sale"],
  },
  {
    id: "best-sellers",
    question: "What sells best?",
    keywords: ["best seller", "bestseller", "popular", "top selling", "favourite", "favorite"],
    lines: () => ["These two go out of stock fastest — both are restocked every few weeks."],
    productIds: bestSellerIds,
    followUps: ["new-in", "sizes", "shipping"],
  },
  {
    id: "sale",
    question: "Anything on sale?",
    keywords: ["sale", "discount", "off", "reduced", "offer", "deal", "cheap"],
    lines: (price) => [
      `Yes — ${saleIds.length} articles are marked down, from ${range(saleIds, price)}.`,
      "Sale pieces ship like everything else, and can still be altered free.",
    ],
    productIds: saleIds,
    followUps: ["shipping", "returns", "payment"],
  },

  /* The article itself — what a visitor is actually buying */
  {
    id: "article-pieces",
    question: "What does 2 pc / 3 pc mean?",
    keywords: ["2 pc", "3 pc", "piece", "pieces", "unstitched", "stitched", "included", "set"],
    lines: () => [
      "A 2 pc article is shirt and trouser. A 3 pc adds the dupatta.",
      "Where a listing says neither, it is a single stitched shirt — a kurta on its own.",
      "Everything on the site arrives stitched. We don't sell unstitched cloth.",
    ],
    followUps: ["article-fabric", "sizes", "categories"],
  },
  {
    id: "article-fabric",
    question: "What fabrics do you use?",
    keywords: ["fabric", "material", "cloth", "lawn", "silk", "cotton", "organza", "chikankari"],
    lines: () => [
      "Summer lines are lawn, cambric and cotton silk. Luxury pret is tissue, organza, raw silk and chikankari, finished by hand.",
      "Every listing names its own fabric — it is the line printed under the name.",
    ],
    followUps: ["article-care", "article-pieces", "categories"],
  },
  {
    id: "article-care",
    question: "How do I care for it?",
    keywords: ["care", "wash", "washing", "iron", "dry clean", "shrink", "bleed"],
    lines: () => [
      "Lawn, cambric and cotton silk: cold hand wash, dry in shade, iron on medium from the reverse.",
      "Tissue, organza, raw silk and anything embroidered or zari-worked: dry clean only.",
      "Wash the first time separately — deep maroons and indigos can bleed a little.",
    ],
    followUps: ["article-fabric", "returns"],
  },
  {
    id: "article-price",
    question: "How much do pieces cost?",
    keywords: ["price", "prices", "cost", "how much", "rate", "budget", "expensive"],
    lines: (price) => [
      `Pieces on the rail run ${price(Math.min(...catalogueAed))} to ${price(Math.max(...catalogueAed))}. Luxury Pret tops out at ${price(Math.max(...pretAed))}.`,
      `Everything is priced in AED, with 5% VAT added at checkout. Delivery is free on orders over ${price(storeConfig.freeShippingThresholdAed)}.`,
    ],
    followUps: ["payment", "sale", "categories"],
  },
  {
    id: "article-stock",
    question: "Is my size in stock?",
    keywords: ["stock", "available", "availability", "sold out", "restock", "reserve"],
    lines: () => [
      "Ready-to-wear sizes on the rail ship the same week. If your size has gone, we can stitch the same design to your measurements instead — no extra charge at standard sizes.",
      "Send us the article name on WhatsApp and we'll confirm stock before you pay.",
    ],
    followUps: ["silai", "sizes", "contact"],
  },

  /* What a visitor needs settled before ordering */
  {
    id: "silai",
    question: "Silai — made to order",
    keywords: ["silai", "made to order", "custom", "tailor", "tailoring", "stitching", "bespoke"],
    lines: () => [
      "Choose any design on the site, send your measurements on WhatsApp, or bring a garment that fits into our boutique at Madina Mall, Al Muhaisnah 4. Our in-house tailors cut and finish the piece by hand.",
      "Free alterations on every silai order — we keep altering until it fits.",
      "Stitching starts at AED 24 for a kurta and AED 42 for a three-piece, with bridal from AED 158. A kurta takes 7–10 days, a three-piece 10–14, bridal 4–6 weeks — the Silai page carries the full table of AED charges and turnarounds.",
    ],
    followUps: ["silai-measurements", "alterations", "sizes", "contact"],
  },
  {
    id: "silai-measurements",
    question: "Which measurements do you need?",
    keywords: ["measurement", "measurements", "measure", "bust", "waist", "sleeve", "shoulder"],
    lines: () => [
      "Ten numbers, in inches: shirt length, shoulder, chest, waist, hip, neck depth, sleeve length, armhole, sleeve opening and trouser length.",
      "Easier still — measure a shirt you already like wearing and send us those. That is what most customers do.",
    ],
    followUps: ["silai", "alterations", "contact"],
  },
  {
    id: "alterations",
    question: "Do you alter?",
    keywords: ["alter", "alteration", "alterations", "resize", "adjust", "loose", "tight"],
    lines: () => [
      "Free alterations on every silai order, for as many rounds as it takes.",
      "Ready-to-wear can be altered too: send it back within 7 days, or walk it into Madina Mall, and we cover the stitching — you cover return postage.",
    ],
    followUps: ["silai", "returns", "sizes"],
  },
  {
    id: "sizes",
    question: "Sizes & fit",
    keywords: ["size", "sizes", "sizing", "fit", "small", "medium", "large", "size guide"],
    lines: () => [
      "Ready to wear runs XS to XXL, cut a touch relaxed through the bust and hip.",
      "Between two sizes, take the larger one — a shirt is easy to take in and hard to let out.",
      "Or skip sizing altogether and have it stitched to your own measurements.",
    ],
    followUps: ["silai", "alterations", "article-stock"],
  },
  {
    id: "shipping",
    question: "Shipping & delivery",
    keywords: ["ship", "shipping", "delivery", "deliver", "courier", "international", "worldwide", "abroad"],
    lines: (price) => [
      `Fast delivery across Dubai and all 7 Emirates — free on orders over ${price(storeConfig.freeShippingThresholdAed)}; below that a flat courier charge applies.`,
      "Dubai and Sharjah: same or next day. The other emirates: 1–3 working days. Saudi Arabia, the UK and the rest of the world: 5–7 days.",
      "Silai orders add 7–10 working days of stitching before they ship.",
    ],
    followUps: ["track-order", "payment", "returns"],
  },
  {
    id: "payment",
    question: "How can I pay?",
    keywords: ["pay", "payment", "cod", "cash on delivery", "card", "bank", "transfer", "advance"],
    lines: () => [
      "Cash on delivery anywhere in the UAE, bank transfer to our Emirates account, or card and Apple Pay through Stripe.",
      "Orders outside the UAE are card or bank transfer only — there is no cash on delivery abroad.",
      "Silai orders take 50% in advance in AED and the rest on delivery.",
    ],
    followUps: ["shipping", "article-price", "returns"],
  },
  {
    id: "returns",
    question: "Returns & exchange",
    keywords: ["return", "returns", "exchange", "refund", "swap", "damaged", "faulty"],
    lines: () => [
      "Seven days from delivery to exchange a ready-to-wear piece — unworn, unwashed, tags on. Post it back, or bring it to the boutique at Madina Mall, Al Muhaisnah 4.",
      "Made-to-measure silai cannot be exchanged for size, but alterations are free until it fits.",
      "If a piece arrives damaged or is not what you ordered, we replace it and cover postage both ways anywhere in the UAE. Card refunds go back to the card that paid; cash orders are refunded by transfer.",
    ],
    followUps: ["alterations", "track-order", "contact"],
  },
  {
    id: "track-order",
    question: "Where is my order?",
    keywords: ["track", "tracking", "order status", "dispatch", "dispatched", "shipped"],
    lines: () => [
      "Open the Track Order page in the footer, enter your order number (it looks like FZ-26-1001) and the email you ordered with, and it will show you where the parcel has got to.",
      "A tracking number reaches you by email the moment the parcel is handed to Aramex, Emirates Post or DHL.",
      "Or send us your order number on WhatsApp and we will check it for you right away.",
    ],
    followUps: ["shipping", "contact"],
  },
  {
    id: "contact",
    question: "Talk to a person",
    keywords: [
      "contact",
      "whatsapp",
      "human",
      "call",
      "phone",
      "email",
      "talk",
      "agent",
      "address",
      "shop",
      "store",
      "location",
      "dubai",
    ],
    lines: () => [
      `WhatsApp us on ${contact.whatsapp.display} — our team answers ${contact.hours}.`,
      `You can also write to ${contact.email}, or come and see us at our flagship boutique — ${contact.address.oneLine}.`,
    ],
    followUps: ["silai", "track-order", "categories"],
  },
];

export const chatTopics: ChatTopic[] = [...staticTopics, ...categoryTopics, ...lineTopics];

const byId = new Map(chatTopics.map((t) => [t.id, t]));

export const topicsByIds = (ids: readonly string[]): ChatTopic[] =>
  ids.map((id) => byId.get(id)).filter((t): t is ChatTopic => Boolean(t));

/** The chips the assistant opens with, and falls back to when a reply has none. */
export const rootTopicIds = [
  "categories",
  "new-in",
  "silai",
  "sizes",
  "shipping",
  "payment",
  "returns",
  "contact",
] as const;

export const welcomeLines = [
  "Assalam-o-Alaikum, and welcome to FEEZEE.",
  "I can help with our categories, the article you are looking at, sizing, silai orders, delivery and payment. What would you like to know?",
];

export const fallbackLines = [
  "That one is not in my notes yet — I only answer from what the team has written down.",
  `Try a question below, or message them on WhatsApp at ${contact.whatsapp.display}: they reply ${contact.hours}.`,
];

/** Drops a plural "s", so "kurta" and "kurtas" are the same word to us. */
const stem = (word: string) => (word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word);

/** A phrase as its bare words: lowercased, punctuation dropped, plurals stemmed. */
const tokens = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter(Boolean).map(stem);

/** Whether `phrase` appears as consecutive words of `words`. */
function hasRun(words: readonly string[], phrase: readonly string[]) {
  outer: for (let i = 0; i <= words.length - phrase.length; i++) {
    for (let j = 0; j < phrase.length; j++) if (words[i + j] !== phrase[j]) continue outer;
    return true;
  }
  return false;
}

/*
 * The routing table, built once. Keywords are deduplicated by their stemmed
 * words — "piece" and "pieces" are one signal, not two — and a chip-label word
 * that is already a keyword is dropped so it cannot score the topic twice.
 */
const searchIndex = chatTopics.map((topic) => {
  const keywords = new Map<string, string[]>();
  for (const keyword of topic.keywords) {
    const words = tokens(keyword);
    if (words.length > 0) keywords.set(words.join(" "), words);
  }

  const labels = new Set(tokens(topic.question).filter((w) => w.length > 3));
  for (const key of keywords.keys()) labels.delete(key);

  return { topic, keywords: [...keywords.values()], labels: [...labels] };
});

/**
 * Routes a typed question to a topic.
 *
 * A keyword scores by how specific it is — one point plus one per word, so
 * "made to order" outweighs a bare "order" — and a word from the topic's own
 * chip label adds one, which lands someone who types our question back at us.
 * Nothing under two points matches, so a stray word picks no topic at all and
 * the visitor gets the fallback instead of a confident wrong answer.
 */
export function matchTopic(input: string): ChatTopic | null {
  const words = tokens(input);
  if (words.length === 0) return null;
  const present = new Set(words);

  let best: ChatTopic | null = null;
  let bestScore = 0;

  for (const { topic, keywords, labels } of searchIndex) {
    let score = 0;
    for (const keyword of keywords) if (hasRun(words, keyword)) score += 1 + keyword.length;
    for (const label of labels) if (present.has(label)) score += 1;

    if (score > bestScore) {
      bestScore = score;
      best = topic;
    }
  }

  return bestScore >= 2 ? best : null;
}
