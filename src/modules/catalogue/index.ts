import "server-only";
import { prisma } from "@/lib/prisma";
import { toAed, toAedOrNull } from "@/modules/shared/money";
import { discountPct } from "@/content/products";
import type { Collection, Product, ProductType } from "@/content/products";
import type { Size, SizeState } from "@/content/product-detail";

/**
 * The catalogue, read from the database.
 *
 * Everything here returns the same `Product` shape the design-time content file
 * defined, so every card, rail and grid the showcase already had keeps working
 * unchanged — they take a `Product`, and this hands them one. What the database
 * adds on top is the part a showcase never had: a variant per size, with the
 * stock actually on the rail.
 *
 * All of it is plain JSON. No Prisma `Decimal` and no `Date` crosses this
 * boundary, because these objects get handed to client components.
 */

export type VariantView = {
  id: string;
  size: Size;
  sku: string;
  stock: number;
  /** The price of this size — the variant override, or the product's price. */
  priceAed: number;
  /** What the size chip says: in stock, last few, or gone. */
  state: SizeState;
};

export type ProductView = Product & {
  slug: string;
  /** Every frame, worn shot first. */
  images: string[];
  colour: string;
  cut: string;
  description: string;
  care: string;
  isArchived: boolean;
  variants: VariantView[];
};

/** The shape Prisma gives back for the queries below. */
type Row = NonNullable<Awaited<ReturnType<typeof findRow>>>;

function findRow(where: { id: number } | { slug: string }) {
  return prisma.product.findUnique({
    where,
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
    },
  });
}

/** Chart order, so a size row never comes back shuffled by the database. */
const SIZE_ORDER: readonly string[] = ["XS", "S", "M", "L", "XL", "XXL"];

function variantState(stock: number, lowStockThreshold: number): SizeState {
  if (stock <= 0) return "out";
  return stock <= lowStockThreshold ? "low" : "in";
}

function toView(row: Row): ProductView {
  const aed = toAed(row.aed);

  return {
    id: row.id,
    name: row.name,
    fabric: row.fabric,
    fabricFamily: row.fabricFamily,
    type: row.type as ProductType,
    pieces: row.pieces as 1 | 2 | 3,
    withDupatta: row.withDupatta,
    collection: row.collection as Collection,
    aed,
    ...(row.wasAed ? { wasAed: toAed(row.wasAed) } : {}),
    img: row.images.find((i) => i.isFeatured)?.url ?? row.images[0]?.url ?? "",
    ...(row.badgeLabel && row.badgeTone
      ? { badge: { label: row.badgeLabel, tone: row.badgeTone as "gold" | "wine" } }
      : {}),

    slug: row.slug,
    images: row.images.map((i) => i.url),
    colour: row.colour,
    cut: row.cut,
    description: row.description,
    care: row.careInstructions,
    isArchived: row.isArchived,
    variants: [...row.variants]
      .sort(
        (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size),
      )
      .map((v) => ({
        id: v.id,
        size: v.size as Size,
        sku: v.sku,
        stock: v.stock,
        priceAed: toAedOrNull(v.priceAed) ?? aed,
        state: variantState(v.stock, v.lowStockThreshold),
      })),
  };
}

const listInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  variants: { orderBy: { createdAt: "asc" } },
} as const;

/** Every garment on sale, catalogue order. Archived pieces never appear. */
export async function allProducts(): Promise<ProductView[]> {
  const rows = await prisma.product.findMany({
    where: { isArchived: false },
    include: listInclude,
    orderBy: { id: "asc" },
  });
  return rows.map(toView);
}

/**
 * The garments in one line — every one of them, marked down or not.
 *
 * A reduction is a price, not a line. A Luxury Pret piece at 30% off is still
 * Luxury Pret, so it stays on `/luxury-pret` with its strikethrough and its
 * badge and *also* appears on `/sale`. Only the legacy pieces whose
 * `collection` column literally reads "Sale" live on one page alone.
 */
export async function productsInCollection(
  collection: Collection,
): Promise<ProductView[]> {
  const rows = await prisma.product.findMany({
    where: { isArchived: false, collection },
    include: listInclude,
    orderBy: { id: "asc" },
  });
  return rows.map(toView);
}

/** True once a garment is asking less than it used to. */
function isReduced(product: ProductView): boolean {
  return product.wasAed !== undefined && product.wasAed > product.aed;
}

/**
 * Everything currently reduced, deepest cut first.
 *
 * Two things land here. A piece marked down in place — `wasAed` above `aed`,
 * whatever line it belongs to — which is how the shop discounts from now on,
 * and a piece whose `collection` was set to "Sale" outright, which is how it
 * was done before and is still honoured so no garment silently leaves the page.
 *
 * The comparison is made in JavaScript rather than in SQL: the narrowing the
 * database can do (a `wasAed` at all, or the old line) is done there, and the
 * column-against-column part — is the old price actually above the new one —
 * is done on the handful of rows that come back, where the two Decimals have
 * already been resolved to numbers by `toView`.
 */
export async function saleProducts(): Promise<ProductView[]> {
  const rows = await prisma.product.findMany({
    where: {
      isArchived: false,
      OR: [{ wasAed: { not: null } }, { collection: "Sale" }],
    },
    include: listInclude,
    orderBy: { createdAt: "desc" },
  });

  return rows
    .map(toView)
    .filter((p) => isReduced(p) || p.collection === "Sale")
    // Stable, so pieces cut by the same percentage stay newest first.
    .sort((a, b) => (discountPct(b) ?? 0) - (discountPct(a) ?? 0));
}

/** New In: the three lines together, Sale excluded by construction. */
export async function newInProducts(): Promise<ProductView[]> {
  const rows = await prisma.product.findMany({
    where: {
      isArchived: false,
      collection: { in: ["Printed Lawn", "Luxury Pret", "Ready to Wear"] },
    },
    include: listInclude,
    orderBy: { id: "asc" },
  });
  return rows.map(toView);
}

/** One garment by its slug, or null — an unknown slug is a 404. */
export async function productBySlug(slug: string): Promise<ProductView | null> {
  const row = await findRow({ slug });
  return row && !row.isArchived ? toView(row) : null;
}

/** One garment by catalogue id, archived or not — the admin needs both. */
export async function productById(id: number): Promise<ProductView | null> {
  const row = await findRow({ id });
  return row ? toView(row) : null;
}

/** Several garments by id, in the order asked for. Used by the assistant. */
export async function productsByIds(ids: readonly number[]): Promise<ProductView[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.product.findMany({
    where: { id: { in: [...ids] }, isArchived: false },
    include: listInclude,
  });
  const byId = new Map(rows.map((r) => [r.id, toView(r)]));
  return ids.flatMap((id) => {
    const found = byId.get(id);
    return found ? [found] : [];
  });
}

/**
 * Every slug the shop serves, for `generateStaticParams`.
 *
 * Wrapped, because this runs at build time and a build machine has no reason to
 * be able to reach the production database. An empty list is not an error: with
 * `dynamicParams` on, the pages are simply rendered on first request instead of
 * ahead of time.
 */
export async function allProductSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { isArchived: false },
      select: { slug: true },
    });
    return rows.map((r) => r.slug);
  } catch {
    return [];
  }
}

/**
 * What to show under a garment, nearest first: the same line, then the same cut
 * from another line, then whatever else is on the rail — so a page always fills
 * its rail and a small line never leaves it half empty.
 */
export async function relatedProducts(
  product: ProductView,
  count = 4,
): Promise<ProductView[]> {
  const rows = await prisma.product.findMany({
    where: { isArchived: false, id: { not: product.id } },
    include: listInclude,
    orderBy: { id: "asc" },
  });
  const others = rows.map(toView);

  const bands = [
    others.filter((p) => p.collection === product.collection),
    others.filter(
      (p) => p.collection !== product.collection && p.type === product.type,
    ),
    others,
  ];

  const out: ProductView[] = [];
  for (const band of bands) {
    for (const candidate of band) {
      if (out.length >= count) return out;
      if (!out.some((p) => p.id === candidate.id)) out.push(candidate);
    }
  }
  return out.slice(0, count);
}

/** The first size that can actually be added to a bag, or null if none can. */
export function defaultVariant(product: ProductView): VariantView | null {
  return product.variants.find((v) => v.state !== "out") ?? null;
}

/** True while any size of the garment is still on the rail. */
export function isInStock(product: ProductView): boolean {
  return product.variants.some((v) => v.stock > 0);
}
