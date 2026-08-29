export type NavLink = { label: string; href: string; tone?: "sale" };

export const primaryNav: NavLink[] = [
  { label: "New In", href: "#new" },
  { label: "Ready to Wear", href: "#categories" },
  { label: "Luxury Pret", href: "#categories" },
  { label: "Printed Lawn", href: "#categories" },
  { label: "Silai — Made to Order", href: "#silai" },
  { label: "Sale", href: "#new", tone: "sale" },
];

export const footerNav = {
  shop: [
    { label: "New In", href: "#new" },
    { label: "Ready to Wear", href: "#categories" },
    { label: "Luxury Pret", href: "#categories" },
    { label: "Made to Order", href: "#silai" },
  ],
  help: [
    { label: "Size Guide", href: "#footer" },
    { label: "Shipping & Returns", href: "#footer" },
    { label: "WhatsApp Us", href: "#footer" },
    { label: "Track Order", href: "#footer" },
  ],
} as const;
