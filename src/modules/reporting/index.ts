import "server-only";
import { prisma } from "@/lib/prisma";
import { toAed, round2 } from "@/modules/shared/money";
import { lowStockVariants } from "@/modules/inventory";
import { shiftShopDay, shopDateKey, startOfShopDay } from "@/lib/shop-time";

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

/** A named range, resolved against the shop's clock — Dubai days, not the server's. */
export function resolveRange(preset: RangePreset): DateRange {
  const to = new Date();
  const today = shopDateKey(to);

  let start = today;
  switch (preset) {
    case "Today":
      break;
    case "Last 7 Days":
      start = shiftShopDay(today, -6);
      break;
    case "Last 30 Days":
      start = shiftShopDay(today, -29);
      break;
    case "This Month":
      start = `${today.slice(0, 8)}01`;
      break;
  }
  return { from: startOfShopDay(start)!, to };
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

/**
 * Every headline number in one statement.
 *
 * This used to be six queries run in parallel, which reads as free and is
 * not: with the database ~100 ms away (§4.21) six parallel queries want six
 * connections, and on a cold pool each one is a ~500 ms handshake paid
 * simultaneously. One statement is one connection and one round trip. The
 * order aggregates share a single scan of the range via `FILTER`; the three
 * all-time counts are scalar subqueries on their own indexes.
 */
export async function metrics(range: DateRange): Promise<Metrics> {
  const [row] = await prisma.$queryRaw<
    {
      gross: string;
      vat: string;
      orders: bigint;
      net: string;
      items: bigint;
      pending: bigint;
      lowStock: bigint;
      openReturns: bigint;
    }[]
  >`
    WITH placed AS (
      SELECT id, "totalAed", "vatAed", "fulfillmentStatus", "paymentStatus"
        FROM "Order"
       WHERE "placedAt" BETWEEN ${range.from} AND ${range.to}
    )
    SELECT COALESCE(SUM("totalAed") FILTER (WHERE "fulfillmentStatus" <> 'CANCELLED'), 0)::text AS gross,
           COALESCE(SUM("vatAed")   FILTER (WHERE "fulfillmentStatus" <> 'CANCELLED'), 0)::text AS vat,
           COUNT(*)                 FILTER (WHERE "fulfillmentStatus" <> 'CANCELLED')            AS orders,
           COALESCE(SUM("totalAed") FILTER (WHERE "paymentStatus" = 'PAID'), 0)::text          AS net,
           (SELECT COALESCE(SUM(oi.quantity), 0)::bigint
              FROM "OrderItem" oi
              JOIN placed o ON o.id = oi."orderId"
             WHERE o."fulfillmentStatus" <> 'CANCELLED')                                       AS items,
           (SELECT COUNT(*)::bigint
              FROM "Order"
             WHERE "fulfillmentStatus" IN ('PENDING', 'PROCESSING'))                          AS pending,
           (SELECT COUNT(*)::bigint
              FROM "ProductVariant" v
              JOIN "Product" p ON p.id = v."productId"
             WHERE p."isArchived" = false
               AND v.stock <= v."lowStockThreshold")                                          AS "lowStock",
           (SELECT COUNT(*)::bigint
              FROM "ReturnRequest"
             WHERE status IN ('PENDING', 'APPROVED', 'RECEIVED'))                            AS "openReturns"
      FROM placed
  `;

  const grossRevenueAed = round2(Number(row?.gross ?? 0));
  const orderCount = Number(row?.orders ?? 0);

  return {
    grossRevenueAed,
    netRevenueAed: round2(Number(row?.net ?? 0)),
    vatCollectedAed: round2(Number(row?.vat ?? 0)),
    orderCount,
    averageOrderValueAed: orderCount ? round2(grossRevenueAed / orderCount) : 0,
    itemsSold: Number(row?.items ?? 0),
    pendingOrders: Number(row?.pending ?? 0),
    lowStockCount: Number(row?.lowStock ?? 0),
    openReturns: Number(row?.openReturns ?? 0),
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
    SELECT date_trunc('day', ("placedAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Dubai') AS day,
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

  // Keys sort as strings, so the walk from the first Dubai day to the last
  // needs no Date arithmetic and cannot drift across a timezone boundary.
  const out: SeriesPoint[] = [];
  const last = shopDateKey(range.to);
  for (let key = shopDateKey(range.from); key <= last; key = shiftShopDay(key, 1)) {
    const hit = found.get(key);
    out.push({
      date: key,
      revenueAed: hit?.revenueAed ?? 0,
      orders: hit?.orders ?? 0,
    });
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
