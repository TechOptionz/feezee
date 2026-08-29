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

export const products: Product[] = [
  {
    id: 1,
    name: "Gulbahar Pearl Kurta",
    fabric: "Embroidered cotton silk",
    pkr: 6850,
    img: "p02.jpg",
    badge: { label: "New", tone: "gold" },
  },
  { id: 2, name: "Shirin Zari Kurta", fabric: "Maroon raw silk", pkr: 8450, img: "p09.jpg" },
  {
    id: 3,
    name: "Feroza Tissue Suit",
    fabric: "Pistachio tissue, 2 pc",
    pkr: 12900,
    img: "p15.jpg",
    badge: { label: "New", tone: "gold" },
  },
  {
    id: 4,
    name: "Laila Heritage Print",
    fabric: "Printed viscose",
    pkr: 7250,
    img: "p11.jpg",
    badge: { label: "Best Seller", tone: "wine" },
  },
  { id: 5, name: "Noor Midnight Kurta", fabric: "Black embroidered lawn", pkr: 9200, img: "p23.jpg" },
  { id: 6, name: "Sahar Ivory Pret", fabric: "Self-embroidered grip", pkr: 7900, img: "p25.jpg" },
  {
    id: 7,
    name: "Zainab Block Print",
    fabric: "Printed cambric",
    pkr: 5450,
    wasPkr: 6800,
    img: "p30.jpg",
    badge: { label: "Sale", tone: "wine" },
  },
  { id: 8, name: "Mehr Mint Luxury Suit", fabric: "Chikankari lawn, 3 pc", pkr: 14500, img: "p28.jpg" },
];

export type Category = { name: string; img: string; href: string };

export const categories: Category[] = [
  { name: "Luxury Pret", img: "p29.jpg", href: "#new" },
  { name: "Printed Lawn", img: "p22.jpg", href: "#new" },
  { name: "Festive Formals", img: "p27.jpg", href: "#new" },
  { name: "Co-ord Sets", img: "p20.jpg", href: "#new" },
];

export const lookbook: string[] = [
  "p13.jpg",
  "p24.jpg",
  "p26.jpg",
  "p31.jpg",
  "p16.jpg",
  "p03.jpg",
];
