/**
 * Everything the Silai page says.
 *
 * Silai is the made-to-order half of the shop: the same designs the grids
 * sell, cut to a customer's own measurements instead of the house block. It
 * has no catalogue of its own — what it sells is the service — so all of its
 * copy lives here rather than being derived from `products.ts`.
 *
 * The page-level components read straight off these lists, which is what lets
 * a price change or a new finish be a one-line edit in this file.
 */

/**
 * Where every "start an order" button on the page points.
 *
 * It is the page's own closing band rather than the `wa.me` link: the band
 * lists the five things a tailor needs before anyone opens a chat, and its
 * button is the one that hands the visitor over to WhatsApp. Point this at
 * `whatsappHref()` from `@/lib/site` to skip that step.
 */
export const silaiOrderHref = "#start";

export const silaiMeta = {
  title: "Silai — Made to Order",
  description:
    "FEEZEE Silai — kurtas, suits, anarkalis and bridal wear cut to your own measurements by our in-house tailors. Free alterations, nationwide delivery.",
} as const;

export const silaiBanner = {
  eyebrow: "Silai — Made to Order",
  title: "Cut to your measurements, finished by hand",
  intro:
    "Every piece on this site can be stitched to you instead of to a size chart. Send ten numbers on WhatsApp — or a shirt that already fits — and the tailor who cuts your cloth is the one who finishes it.",
  image: "hero/look-04.jpg",
  /** The three numbers under the standfirst. */
  stats: [
    { value: "In-house", label: "Our own tailors" },
    { value: "7–14 days", label: "For most orders" },
    { value: "Free", label: "Alterations, always" },
  ],
} as const;

export type SilaiStep = { n: string; title: string; body: string };

export const silaiSteps: SilaiStep[] = [
  {
    n: "01",
    title: "Choose the design",
    body: "Anything in New In, Luxury Pret or Printed Lawn — or a picture of something you have seen elsewhere. If you already have the cloth, we will stitch that instead.",
  },
  {
    n: "02",
    title: "Send your measurements",
    body: "Ten numbers on WhatsApp. If you have never measured yourself, post us a shirt that fits you well and we will copy it seam for seam.",
  },
  {
    n: "03",
    title: "We cut and stitch",
    body: "Your cloth is cut on our table, not a factory line. One tailor carries the piece from the first cut to the last button, so nothing is lost between hands.",
  },
  {
    n: "04",
    title: "Try it on at home",
    body: "It arrives pressed and packed. Wear it, and if a seam wants moving, send it back — alterations are free for as long as you own the piece.",
  },
];

export type SilaiService = {
  name: string;
  blurb: string;
  from: string;
  turnaround: string;
  image: string;
};

export const silaiServices: SilaiService[] = [
  {
    name: "Kurtas & Shirts",
    blurb:
      "Straight, A-line or kalidar, in lawn, cambric or khaddar. The everyday cut, stitched to sit at your own shoulder.",
    from: "AED 24",
    turnaround: "7–10 days",
    image: "kurta-ivory-palm.jpg",
  },
  {
    name: "Two & Three Piece Suits",
    blurb:
      "Shirt, trouser and dupatta finished together so the fall matches. Lining, piping and pico included on every three-piece.",
    from: "AED 42",
    turnaround: "10–14 days",
    image: "suit-teal-embroidered.jpg",
  },
  {
    name: "Anarkalis & Frocks",
    blurb:
      "Panelled and flared, with the kalis set by hand so the hem hangs level all the way round. Cancan and lining on request.",
    from: "AED 59",
    turnaround: "12–16 days",
    image: "suit-sea-green-anarkali.jpg",
  },
  {
    name: "Bridal & Heavy Formals",
    blurb:
      "Embroidered panels cut before they are joined, with two fittings on the way. Booked by appointment, six weeks ahead.",
    from: "AED 158",
    turnaround: "4–6 weeks",
    image: "suit-rose-pink.jpg",
  },
];

/**
 * The measurements we ask for, in the order a tailor takes them: down the
 * shirt first, then the sleeve, then the trouser.
 */
export const silaiMeasurements = {
  image: "hero/look-07.jpg",
  groups: [
    {
      title: "Shirt",
      items: [
        "Shirt length",
        "Shoulder",
        "Chest",
        "Waist",
        "Hip",
        "Neck depth, front and back",
      ],
    },
    {
      title: "Sleeve",
      items: ["Sleeve length", "Armhole", "Sleeve opening (muhri)"],
    },
    {
      title: "Trouser",
      items: ["Trouser length", "Trouser bottom (paincha)", "Waist and hip"],
    },
  ],
  note: "Measure over a fitted shirt, not over loose clothes, and keep the tape flat. If any of this sounds like guesswork, skip it — send us a garment that fits and we will take every number off it ourselves.",
} as const;

export type FinishGroup = { title: string; options: string[] };

/** What a customer gets to choose once the measurements are settled. */
export const silaiFinishes: FinishGroup[] = [
  {
    title: "Neckline",
    options: ["Round", "V-neck", "Sweetheart", "Boat", "Collared", "Keyhole"],
  },
  {
    title: "Sleeve",
    options: ["Full", "Three-quarter", "Bell", "Bishop", "Cap", "Sleeveless"],
  },
  {
    title: "Shirt cut",
    options: [
      "Straight",
      "A-line",
      "Kalidar",
      "High-low",
      "Front open",
      "Peplum",
    ],
  },
  {
    title: "Trouser",
    options: ["Straight", "Cigarette", "Palazzo", "Sharara", "Gharara", "Tulip"],
  },
  {
    title: "Finishing",
    options: [
      "Full lining",
      "Piping",
      "Lace edging",
      "Pico hem",
      "Hand-rolled hem",
      "Concealed zip",
    ],
  },
];

export type PriceRow = {
  garment: string;
  detail: string;
  stitching: string;
  turnaround: string;
};

/**
 * Stitching charges only — the cloth is priced separately, or brought by the
 * customer. Every row is the plain version of the garment; embroidery, cancan
 * and second linings are quoted on the piece.
 */
export const silaiPricing: PriceRow[] = [
  {
    garment: "Kurta",
    detail: "Shirt only, plain or printed",
    stitching: "AED 24",
    turnaround: "7–10 days",
  },
  {
    garment: "Two piece",
    detail: "Shirt and trouser",
    stitching: "AED 34",
    turnaround: "8–12 days",
  },
  {
    garment: "Three piece",
    detail: "Shirt, trouser and dupatta finish",
    stitching: "AED 42",
    turnaround: "10–14 days",
  },
  {
    garment: "Anarkali / frock",
    detail: "Panelled, lined, cancan optional",
    stitching: "AED 59",
    turnaround: "12–16 days",
  },
  {
    garment: "Sharara / gharara set",
    detail: "Shirt with panelled bottoms",
    stitching: "AED 86",
    turnaround: "14–18 days",
  },
  {
    garment: "Bridal / heavy formal",
    detail: "Embroidered panels, two fittings",
    stitching: "From AED 158",
    turnaround: "4–6 weeks",
  },
];

/** The three lines that sit under the table. */
export const silaiPricingNotes: string[] = [
  "Charges are for stitching. Cloth is billed separately, or bring your own.",
  "Rush orders are cut in three to five days at a 40% surcharge, subject to the table.",
  "Alterations are free for life. Return postage on the first alteration is on us.",
];

export type SilaiLook = { img: string; caption: string };

/**
 * Finished pieces off our own table — the proof under all of the above.
 *
 * These are the alternate frames of garments the shop already sells (see the
 * note at the top of `products.ts`), so nothing here is a piece the grids
 * cannot show you.
 */
export const silaiGallery: SilaiLook[] = [
  { img: "p19.jpg", caption: "Sea green anarkali, kalidar hem" },
  { img: "p17.jpg", caption: "Ajrak co-ord, pico finish" },
  { img: "p20.jpg", caption: "Teal three piece, lined shirt" },
  { img: "p06.jpg", caption: "Sage tissue, hand-rolled dupatta" },
  { img: "p26.jpg", caption: "Grey blossom kurta, cigarette trouser" },
  { img: "p07.jpg", caption: "Rose pret, sweetheart neck" },
  { img: "p10.jpg", caption: "Ivory lace, concealed zip" },
  { img: "p31.jpg", caption: "Monochrome co-ord, boat neck" },
];

export type Voice = { quote: string; name: string; city: string };

export const silaiVoices: Voice[] = [
  {
    quote:
      "I sent a kurta I had worn to death and asked for three more like it. They came back closer to the original than the original.",
    name: "Ayesha R.",
    city: "Lahore",
  },
  {
    quote:
      "Ordered an anarkali for my sister's mehndi from Dubai. Measurements over WhatsApp, stitched in eleven days, and the hem was dead level.",
    name: "Mahnoor S.",
    city: "Dubai",
  },
  {
    quote:
      "The sleeve was a touch tight. They collected it, moved the armhole and had it back in four days without charging a dirham.",
    name: "Hira K.",
    city: "Karachi",
  },
];

export type Faq = { q: string; a: string };

export const silaiFaqs: Faq[] = [
  {
    q: "What if I do not know how to measure myself?",
    a: "Post us a shirt and a trouser that already fit you well. We take every measurement off the garment on our own table, note it against your name, and send the pieces back with your order. After the first time we have your numbers on file, so the next order needs nothing but a design.",
  },
  {
    q: "Can you stitch cloth I already own?",
    a: "Yes. Send the unstitched suit to our workshop and we will cut it to the design you choose. Stitching is charged at the rates in the table above; there is nothing extra for using your own cloth.",
  },
  {
    q: "How exact is the fit the first time?",
    a: "For a kurta or a two-piece, almost always right on the first cut. For anything fitted through the waist — an anarkali, a bridal shirt — we cut with a small allowance in the side seams so it can be taken in against your body rather than against a tape.",
  },
  {
    q: "What happens if it does not fit?",
    a: "You send it back and we alter it. Alterations are free for as long as you own the piece, and we cover return postage on the first one. Nothing about a made-to-order piece is final at delivery.",
  },
  {
    q: "Do you deliver outside Pakistan?",
    a: "We ship to the UAE, the UK, Saudi Arabia, the US and most of Europe, usually in five to seven days once the piece leaves the workshop. Overseas orders are prepaid; inside Pakistan you can pay cash at the door.",
  },
  {
    q: "Can I copy a design I have seen somewhere else?",
    a: "Send the picture. If it is a cut we can hold to honestly we will quote it and say what will differ; if the embroidery on it is a mill print we cannot match, we will tell you that before you pay rather than after.",
  },
  {
    q: "How far ahead should I book a wedding piece?",
    a: "Six weeks for bridal, four for a heavy formal. That leaves room for two fittings and a week of slack, which is what stops a shaadi order becoming a rush job.",
  },
];

/** The checklist in the closing band — what a first message should carry. */
export const silaiChecklist: string[] = [
  "The design, or a picture of it",
  "Your measurements, or a garment that fits",
  "Neckline, sleeve and trouser you want",
  "The date you need it by",
  "Your city, for delivery",
];
