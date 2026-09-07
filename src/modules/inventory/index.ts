import "server-only";
import { Prisma, StockReason, type PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Stock, and the ledger that explains it.
 *
 * The whole module exists to make one thing true: **the shop cannot sell the
 * same garment twice.** Two customers pressing "Place order" on the last L in
 * the same second is not a rare case on a drop day, and the naive version of
 * this — read the stock, check it, then write it — loses that race every time,
 * because both reads happen before either write.
 *
 * The fix is to never read-then-write. `deductStock` issues a conditional
 * UPDATE, `SET stock = stock - n WHERE id = ? AND stock >= n`, and lets
 * Postgres decide: the row is locked for the duration of the statement, so the
 * second transaction blocks, re-evaluates `stock >= n` against the *new* value,
 * and matches zero rows. Zero rows updated is the oversell, caught.
 *
 * Every movement writes a `StockAdjustment` inside the same transaction, so the
 * ledger and the balance can never disagree.
 */

/** Prisma inside an interactive transaction — what every helper here takes. */
export type Tx = Prisma.TransactionClient | PrismaClient;

export class OutOfStockError extends Error {
  constructor(
    readonly variantId: string,
    readonly requested: number,
    readonly available: number,
    readonly label: string,
  ) {
    super(
      available <= 0
        ? `${label} has just sold out.`
        : `Only ${available} left of ${label} — you asked for ${requested}.`,
    );
    this.name = "OutOfStockError";
  }
}

/**
 * Take `quantity` off a variant, or throw.
 *
 * MUST be called inside a transaction that also writes whatever the stock is
 * being taken for — otherwise a later failure leaves the stock gone and no
 * order to show for it.
 */
export async function deductStock(
  tx: Tx,
  variantId: string,
  quantity: number,
  options: { reason?: StockReason; note?: string; userId?: string | null } = {},
): Promise<number> {
  if (quantity <= 0) throw new Error("Quantity must be positive.");

  /*
   * The conditional update is the entire concurrency guarantee. `updateMany`
   * rather than `update` because it can carry a `WHERE` beyond the primary key
   * and reports how many rows it touched, instead of throwing on a miss.
   */
  const updated = await tx.productVariant.updateMany({
    where: { id: variantId, stock: { gte: quantity } },
    data: { stock: { decrement: quantity } },
  });

  if (updated.count === 0) {
    // Nothing changed, so we can safely look at the row to say why.
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { name: true } } },
    });
    if (!variant) throw new Error(`Unknown variant ${variantId}.`);
    throw new OutOfStockError(
      variantId,
      quantity,
      variant.stock,
      `${variant.product.name} (${variant.size})`,
    );
  }

  const after = await tx.productVariant.findUniqueOrThrow({
    where: { id: variantId },
    select: { stock: true },
  });

  await tx.stockAdjustment.create({
    data: {
      variantId,
      quantityDelta: -quantity,
      balanceAfter: after.stock,
      reason: options.reason ?? StockReason.ORDER_DEDUCTION,
      note: options.note,
      userId: options.userId ?? null,
    },
  });

  return after.stock;
}

/**
 * Put `quantity` back — a cancellation, an approved return, or a delivery from
 * the workshop. There is no race to lose here: stock only goes up.
 */
export async function restock(
  tx: Tx,
  variantId: string,
  quantity: number,
  reason: StockReason,
  options: { note?: string; userId?: string | null } = {},
): Promise<number> {
  if (quantity <= 0) throw new Error("Quantity must be positive.");

  const variant = await tx.productVariant.update({
    where: { id: variantId },
    data: { stock: { increment: quantity } },
    select: { stock: true },
  });

  await tx.stockAdjustment.create({
    data: {
      variantId,
      quantityDelta: quantity,
      balanceAfter: variant.stock,
      reason,
      note: options.note,
      userId: options.userId ?? null,
    },
  });

  return variant.stock;
}

/**
 * Set a variant to an absolute count — the shop-floor recount.
 *
 * Recorded as the delta it turned out to be, so the ledger still adds up to the
 * balance. A recount that changes nothing writes nothing.
 */
export async function setStock(
  variantId: string,
  newStock: number,
  reason: StockReason,
  options: { note?: string; userId?: string | null } = {},
): Promise<{ previous: number; current: number; delta: number }> {
  if (newStock < 0) throw new Error("Stock cannot be negative.");

  return prisma.$transaction(async (tx) => {
    const before = await tx.productVariant.findUniqueOrThrow({
      where: { id: variantId },
      select: { stock: true },
    });

    const delta = newStock - before.stock;
    if (delta === 0) {
      return { previous: before.stock, current: before.stock, delta: 0 };
    }

    await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: newStock },
    });

    await tx.stockAdjustment.create({
      data: {
        variantId,
        quantityDelta: delta,
        balanceAfter: newStock,
        reason,
        note: options.note,
        userId: options.userId ?? null,
      },
    });

    return { previous: before.stock, current: newStock, delta };
  });
}

/**
 * Take stock for a whole basket, atomically.
 *
 * One transaction for every line: either the order is fully reserved or nothing
 * moves at all. Lines are sorted by variant id first — two baskets holding the
 * same two garments in opposite orders would otherwise be able to each hold the
 * row the other is waiting for, which is a deadlock. A consistent lock order
 * makes that impossible.
 */
export async function deductMany(
  tx: Tx,
  lines: readonly { variantId: string; quantity: number }[],
  options: { note?: string; userId?: string | null } = {},
): Promise<void> {
  const ordered = [...lines].sort((a, b) => a.variantId.localeCompare(b.variantId));
  for (const line of ordered) {
    await deductStock(tx, line.variantId, line.quantity, {
      reason: StockReason.ORDER_DEDUCTION,
      ...options,
    });
  }
}

export type LowStockRow = {
  variantId: string;
  productId: number;
  productName: string;
  slug: string;
  size: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
};

/**
 * What is about to run out, scarcest first.
 *
 * Sold-out sizes are included: a size on zero is the most urgent thing on the
 * list, not something to filter away because it no longer qualifies as "low".
 */
export async function lowStockVariants(limit = 50): Promise<LowStockRow[]> {
  const rows = await prisma.$queryRaw<
    {
      variantId: string;
      productId: number;
      productName: string;
      slug: string;
      size: string;
      sku: string;
      stock: number;
      lowStockThreshold: number;
    }[]
  >`
    SELECT v.id            AS "variantId",
           p.id            AS "productId",
           p.name          AS "productName",
           p.slug          AS "slug",
           v.size          AS "size",
           v.sku           AS "sku",
           v.stock         AS "stock",
           v."lowStockThreshold" AS "lowStockThreshold"
      FROM "ProductVariant" v
      JOIN "Product" p ON p.id = v."productId"
     WHERE p."isArchived" = false
       AND v.stock <= v."lowStockThreshold"
     ORDER BY v.stock ASC, p.name ASC, v.size ASC
     LIMIT ${limit}
  `;
  return rows;
}

/** How many variants are at or below their threshold — the dashboard badge. */
export async function lowStockCount(): Promise<number> {
  const [row] = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
      FROM "ProductVariant" v
      JOIN "Product" p ON p.id = v."productId"
     WHERE p."isArchived" = false
       AND v.stock <= v."lowStockThreshold"
  `;
  return Number(row?.count ?? 0);
}

/** The movement history for one variant, newest first. */
export async function adjustmentsFor(variantId: string, limit = 50) {
  const rows = await prisma.stockAdjustment.findMany({
    where: { variantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { email: true, name: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    quantityDelta: row.quantityDelta,
    balanceAfter: row.balanceAfter,
    reason: row.reason,
    note: row.note,
    by: row.user?.name ?? row.user?.email ?? "System",
    createdAt: row.createdAt.toISOString(),
  }));
}
