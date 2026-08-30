import type { Product } from "@/content/products";

/**
 * The filtering and sorting behind every shop page.
 *
 * A facet is a named group of options, and an option is a label plus the test
 * that decides whether a garment belongs under it. Keeping the test next to the
 * label is what lets one facet ask about a field (fabric), another about a
 * derived shape (a 3-piece is a dupatta set), and a third about a range
 * (price), without the grid needing to know the difference.
 */
export type FacetOption = {
  label: string;
  match: (product: Product) => boolean;
};

export type Facet = {
  /** The query-string key and the React key. */
  id: "category" | "fabric" | "pieces" | "price";
  /** The heading over the options in the filter panel. */
  title: string;
  options: FacetOption[];
};

/**
 * Every option the shop can offer, in the order the panel lists them. A page
 * only ever renders the ones that match at least one garment it holds, so an
 * empty tick box can never appear — see `facetsFor`.
 */
const ALL_FACETS: Facet[] = [
  {
    id: "category",
    title: "Category",
    options: [
      { label: "Kurtas", match: (p) => p.type === "Kurtas" },
      { label: "Suits", match: (p) => p.type === "Suits" },
      { label: "Co-ords", match: (p) => p.type === "Co-ords" },
      // Cuts across the three above: any piece that ships with its dupatta.
      { label: "Dupatta Sets", match: (p) => p.withDupatta },
    ],
  },
  {
    id: "fabric",
    title: "Fabric",
    options: [
      "Lawn",
      "Cambric",
      "Cotton",
      "Silk",
      "Grip",
      "Chiffon",
      "Tissue",
      "Viscose",
    ].map((family) => ({
      label: family,
      match: (p: Product) => p.fabricFamily === family,
    })),
  },
  {
    id: "pieces",
    title: "Pieces",
    options: [
      { label: "1 Piece", match: (p) => p.pieces === 1 },
      { label: "2 Piece Suits", match: (p) => p.pieces === 2 },
      { label: "3 Piece Suits", match: (p) => p.pieces === 3 },
    ],
  },
  {
    id: "price",
    title: "Price",
    options: [
      { label: "Under Rs 6,000", match: (p) => p.pkr < 6000 },
      { label: "Rs 6,000 – 10,000", match: (p) => p.pkr >= 6000 && p.pkr < 10000 },
      { label: "Rs 10,000 – 15,000", match: (p) => p.pkr >= 10000 && p.pkr < 15000 },
      { label: "Above Rs 15,000", match: (p) => p.pkr >= 15000 },
    ],
  },
];

/**
 * The facets worth showing for one page's stock, with the count beside each
 * option. Options nothing matches are dropped, and a facet left with fewer than
 * two live options is dropped with them — a filter that can only ever return
 * everything is a dead control.
 */
export type LiveFacet = Omit<Facet, "options"> & {
  options: (FacetOption & { count: number })[];
};

export function facetsFor(products: Product[]): LiveFacet[] {
  return ALL_FACETS.map((facet) => ({
    ...facet,
    options: facet.options
      .map((option) => ({
        ...option,
        count: products.filter(option.match).length,
      }))
      .filter((option) => option.count > 0),
  })).filter((facet) => facet.options.length > 1);
}

/** The chosen option labels, keyed by facet id. */
export type Selection = Partial<Record<Facet["id"], string[]>>;

/**
 * Options inside one facet are an OR — ticking Kurtas and Suits widens the
 * grid. Separate facets are an AND — a lawn kurta has to be both. That is the
 * behaviour every shop filter has, and getting it the other way round makes the
 * grid empty out as soon as two boxes are ticked.
 */
export function applyFilters(
  products: Product[],
  facets: LiveFacet[],
  selection: Selection,
): Product[] {
  const active = facets.filter(
    (facet) => (selection[facet.id]?.length ?? 0) > 0,
  );
  if (active.length === 0) return products;

  return products.filter((product) =>
    active.every((facet) =>
      facet.options
        .filter((option) => selection[facet.id]!.includes(option.label))
        .some((option) => option.match(product)),
    ),
  );
}

export const SORTS = [
  "Featured",
  "Price: Low to High",
  "Price: High to Low",
  "Biggest Discount",
  "Name: A – Z",
] as const;

export type Sort = (typeof SORTS)[number];

/** A copy of `products`, ordered. "Featured" is catalogue order, untouched. */
export function applySort(products: Product[], sort: Sort): Product[] {
  const out = [...products];
  switch (sort) {
    case "Price: Low to High":
      return out.sort((a, b) => a.pkr - b.pkr);
    case "Price: High to Low":
      return out.sort((a, b) => b.pkr - a.pkr);
    case "Biggest Discount":
      return out.sort((a, b) => off(b) - off(a));
    case "Name: A – Z":
      return out.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return out;
  }
}

/** Fraction off, or 0 at full price — the key "Biggest Discount" sorts on. */
function off(product: Product): number {
  if (!product.wasPkr || product.wasPkr <= product.pkr) return 0;
  return 1 - product.pkr / product.wasPkr;
}

/** Every ticked option across every facet, as chips for the toolbar. */
export function activeChips(
  selection: Selection,
): { facet: Facet["id"]; label: string }[] {
  return ALL_FACETS.flatMap((facet) =>
    (selection[facet.id] ?? []).map((label) => ({ facet: facet.id, label })),
  );
}

/** `selection` with `label` added to or removed from `facet`. */
export function toggleOption(
  selection: Selection,
  facet: Facet["id"],
  label: string,
): Selection {
  const current = selection[facet] ?? [];
  const next = current.includes(label)
    ? current.filter((l) => l !== label)
    : [...current, label];
  const out = { ...selection, [facet]: next };
  if (next.length === 0) delete out[facet];
  return out;
}
