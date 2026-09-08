import "server-only";
import { prisma } from "@/lib/prisma";
import { toAed, round2 } from "@/modules/shared/money";
import { lowStockCount, lowStockVariants } from "@/modules/inventory";
import { openReturnCount } from "@/modules/returns";

/**
 * What the shop made, and what it needs to reorder.
 *
 * One definition worth stating up front, because every number below depends on
 * it: **gross revenue counts every order that was not cancelled; net revenue
 * counts only the money actually collected and kept.** An order placed on cash
 * on delivery is gross revenue the moment it is placed and net revenue the
 * moment the rider is paid. A refunded order is neither.
 */

export type DateRange = { from: Date; to: Date };

export const RANGE_PRESETS = [
  "Today",
  "Last 7 Days",
  "Last 30 Days",
  "This Month",
] as const;

export type RangePreset = (typeof RANGE_PRESETS)[number];

/** A named range, resolved against the current clock. */
export function resolveRange(preset: RangePreset): DateRange {
  const to = new Date();
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  switch (preset) {
    case "Today":
      break;
    case "Last 7 Days":
      from.setDate(from.getDate() - 6);
      break;
    case "Last 30 Days":
      from.setDate(from.getDate() - 29);
      break;
    case "This Month":
      from.setDate(1);
      break;
  }
  return { from, to };
}

export type Metrics = {
  grossRevenueAed: number;
  netRevenueAed: number;
  vatCollectedAed: number;
  orderCount: number;
  averageOrderValueAed: number;
  itemsSold: number;
  pendingOrders: number;
  lowStockCount: number;
  openReturns: number;
};

export async function metrics(range: DateRange): Promise<Metrics> {
  const placedIn = { placedAt: { gte: range.from, lte: range.to } };

  const [live, paid, items, pending, lowStock, returns] = await Promise.all([
    prisma.order.aggregate({
      where: { ...placedIn, fulfillmentStatus: { not: "CANCELLED" } },
      _sum: { totalAed: true, vatAed: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { ...placedIn, paymentStatus: "PAID" },
      _sum: { totalAed: true },
    }),
    prisma.orderItem.aggregate({
      where: { order: { ...placedIn, fulfillmentStatus: { not: "CANCELLED" } } },
      _sum: { quantity: true },
    }),
    prisma.order.count({
      where: { fulfillmentStatus: { in: ["PENDING", "PROCESSING"] } },
    }),
    lowStockCount(),
    openReturnCount(),
  ]);

  const grossRevenueAed = toAed(live._sum.totalAed);
  const orderCount = live._count;

  return {
    grossRevenueAed,
    netRevenueAed: toAed(paid._sum.totalAed),
    vatCollectedAed: toAed(live._sum.vatAed),
    orderCount,
    averageOrderValueAed: orderCount ? round2(grossRevenueAed / orderCount) : 0,
    itemsSold: items._sum.quantity ?? 0,
    pendingOrders: pending,
    lowStockCount: lowStock,
    openReturns: returns,
  };
}

export type SeriesPoint = { date: string; revenueAed: number; orders: number };

/**
 * Revenue per day across the range.
 *
 * Days with no orders are filled in with zeroes rather than skipped: a chart
 * built from only the days that sold something silently compresses a quiet week
 * into a busy-looking line.
 */
export async function revenueSeries(range: DateRange): Promise<SeriesPoint[]> {
  const rows = await prisma.$queryRaw<
    { day: Date; revenue: string | null; orders: bigint }[]
  >`
    SELECT date_trunc('day', "placedAt") AS day,
           SUM("totalAed")              AS revenue,
           COUNT(*)::bigint             AS orders
      FROM "Order"
     WHERE "placedAt" BETWEEN ${range.from} AND ${range.to}
       AND "fulfillmentStatus" <> 'CANCELLED'
     GROUP BY 1
     ORDER BY 1 ASC
  `;

  const found = new Map(
    rows.map((row) => [
      row.day.toISOString().slice(0, 10),
      { revenueAed: Number(row.revenue ?? 0), orders: Number(row.orders) },
    ]),
  );

  const out: SeriesPoint[] = [];
  const cursor = new Date(range.from);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= range.to) {
    const key = cursor.toISOString().slice(0, 10);
    const hit = found.get(key);
    out.push({
      date: key,
      revenueAed: hit?.revenueAed ?? 0,
      orders: hit?.orders ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return out;
}

export type CollectionSlice = { collection: string; revenueAed: number; units: number };

/** Where the money came from, by line. */
export async function salesByCollection(range: DateRange): Promise<CollectionSlice[]> {
  const rows = await prisma.$queryRaw<
    { collection: string; revenue: string | null; units: bigint }[]
  >`
    SELECT p."collection"      AS collection,
           SUM(oi."totalAed")  AS revenue,
           SUM(oi.quantity)::bigint AS units
      FROM "OrderItem" oi
      JOIN "Order" o           ON o.id = oi."orderId"
      LEFT JOIN "ProductVariant" v ON v.id = oi."variantId"
      LEFT JOIN "Product" p    ON p.id = v."productId"
     WHERE o."placedAt" BETWEEN ${range.from} AND ${range.to}
       AND o."fulfillmentStatus" <> 'CANCELLED'
       AND p."collection" IS NOT NULL
     GROUP BY 1
     ORDER BY 2 DESC
  `;

  return rows.map((row) => ({
    collection: row.collection,
    revenueAed: Number(row.revenue ?? 0),
    units: Number(row.units),
  }));
}

export type TopSeller = {
  productName: string;
  sku: string;
  units: number;
  revenueAed: number;
};

export async function topSellers(range: DateRange, limit = 8): Promise<TopSeller[]> {
  const rows = await prisma.$queryRaw<
    { productName: string; sku: string; units: bigint; revenue: string | null }[]
  >`
    SELECT oi."productName"        AS "productName",
           MIN(oi.sku)             AS sku,
           SUM(oi.quantity)::bigint AS units,
           SUM(oi."totalAed")      AS revenue
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
     WHERE o."placedAt" BETWEEN ${range.from} AND ${range.to}
       AND o."fulfillmentStatus" <> 'CANCELLED'
     GROUP BY oi."productName"
     ORDER BY units DESC
     LIMIT ${limit}
  `;

  return rows.map((row) => ({
    productName: row.productName,
    sku: row.sku,
    units: Number(row.units),
    revenueAed: Number(row.revenue ?? 0),
  }));
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

/**
 * One CSV cell.
 *
 * The leading-character guard is not decoration: a product called `=cmd|...`
 * would be executed as a formula when the file is opened in Excel. Prefixing an
 * apostrophe is the standard defence against CSV injection.
 */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  // A BOM, so Excel opens dirham amounts and Arabic names as UTF-8.
  return (
    "﻿" +
    [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") +
    "\r\n"
  );
}

export async function ordersCsv(range: DateRange): Promise<string> {
  const orders = await prisma.order.findMany({
    where: { placedAt: { gte: range.from, lte: range.to } },
    include: { items: true },
    orderBy: { placedAt: "desc" },
  });

  return toCsv(
    [
      "Order",
      "Placed",
      "Customer",
      "Email",
      "Phone",
      "Emirate",
      "City",
      "Items",
      "Subtotal AED",
      "Delivery AED",
      "VAT AED",
      "Total AED",
      "Payment",
      "Payment status",
      "Fulfilment",
      "Courier",
      "Tracking",
    ],
    orders.map((order) => [
      order.orderNumber,
      order.placedAt.toISOString(),
      order.customerName,
      order.customerEmail,
      `+${order.customerPhone}`,
      order.shippingEmirate,
      order.shippingCity,
      order.items.reduce((n, i) => n + i.quantity, 0),
      toAed(order.subtotalAed),
      toAed(order.shippingFeeAed),
      toAed(order.vatAed),
      toAed(order.totalAed),
      order.paymentMethod,
      order.paymentStatus,
      order.fulfillmentStatus,
      order.courierName ?? "",
      order.trackingNumber ?? "",
    ]),
  );
}

export async function inventoryCsv(): Promise<string> {
  const variants = await prisma.productVariant.findMany({
    include: { product: true },
    orderBy: [{ product: { name: "asc" } }, { size: "asc" }],
  });

  return toCsv(
    [
      "SKU",
      "Product",
      "Collection",
      "Size",
      "Colour",
      "Price AED",
      "Stock",
      "Low stock at",
      "Status",
      "Archived",
    ],
    variants.map((v) => [
      v.sku,
      v.product.name,
      v.product.collection,
      v.size,
      v.colour,
      toAed(v.priceAed ?? v.product.aed),
      v.stock,
      v.lowStockThreshold,
      v.stock === 0 ? "Sold out" : v.stock <= v.lowStockThreshold ? "Low" : "In stock",
      v.product.isArchived ? "Yes" : "No",
    ]),
  );
}

export async function salesCsv(range: DateRange): Promise<string> {
  const series = await revenueSeries(range);
  const byCollection = await salesByCollection(range);

  return toCsv(
    ["Section", "Key", "Orders / Units", "Revenue AED"],
    [
      ...series.map((point) => ["Daily", point.date, point.orders, point.revenueAed]),
      ...byCollection.map((slice) => [
        "Collection",
        slice.collection,
        slice.units,
        slice.revenueAed,
      ]),
    ],
  );
}

/** The dashboard's restock list. */
export { lowStockVariants };
