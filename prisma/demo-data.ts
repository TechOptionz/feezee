import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { DEFAULT_SETTINGS } from "../src/modules/shared/store-policy";

/**
 * Demo data for walking a client through the back office.
 *
 *   npm run demo:add       — a month of orders, some returns, customers, audit rows
 *   npm run demo:remove    — takes every one of them out again
 *
 * Everything this writes is tagged so it can be found and removed cleanly:
 *
 *   - customers and orders use an `@demo.feezee.ae` email address; deleting the
 *     orders cascades to their items, payment transactions, returns and return
 *     items, and deleting the users takes their addresses with them
 *   - audit rows carry `ipAddress = "demo-seed"`
 *
 * It never touches stock, products, settings or real customers. Order numbers
 * come from the shop's own sequence so they look like the real thing and can
 * never collide with a real order. Running `add` twice replaces the set rather
 * than doubling it.
 */

const DEMO_DOMAIN = "demo.feezee.ae";
const DEMO_IP = "demo-seed";
const ADMIN_EMAIL = "admin@feezee.ae";

// ---------------------------------------------------------------------------
// Deterministic randomness, so the demo looks the same on every machine.
// ---------------------------------------------------------------------------

let seed = 20260924;
function rand(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
function pick<T>(list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)]!;
}
function between(min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

const SUFFIX_ALPHABET = [..."ABCDEFGHJKMNPQRSTUVWXYZ23456789"];
function suffix(): string {
  let out = "";
  for (let i = 0; i < 4; i++) out += pick(SUFFIX_ALPHABET);
  return out;
}

const DAY = 24 * 60 * 60 * 1000;
/** An instant `daysAgo` days back, at a plausible shop hour in Dubai. */
function at(daysAgo: number, hour = between(10, 22), minute = between(0, 59)): Date {
  const now = new Date();
  const dubaiDay = new Date(now.getTime() - daysAgo * DAY);
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dubaiDay);
  const when = new Date(`${key}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+04:00`);
  return when > now ? now : when;
}

// ---------------------------------------------------------------------------
// The cast
// ---------------------------------------------------------------------------

const CUSTOMERS = [
  { name: "Mariam Al Suwaidi", email: `mariam.alsuwaidi@${DEMO_DOMAIN}`, phone: "971501112233", emirate: "Dubai", city: "Jumeirah", line: "Villa 14, Street 8b, Jumeirah 1", landmark: "Behind Mercato Mall" },
  { name: "Ayesha Rahman", email: `ayesha.rahman@${DEMO_DOMAIN}`, phone: "971552223344", emirate: "Dubai", city: "Al Barsha", line: "Flat 1207, Al Murad Tower, Al Barsha 1", landmark: "Opposite Mall of the Emirates" },
  { name: "Hina Malik", email: `hina.malik@${DEMO_DOMAIN}`, phone: "971563334455", emirate: "Sharjah", city: "Al Majaz", line: "Flat 903, Al Majaz Pearl, Corniche Street", landmark: null },
  { name: "Fatima Hussain", email: `fatima.hussain@${DEMO_DOMAIN}`, phone: "971504445566", emirate: "Abu Dhabi", city: "Khalifa City", line: "Villa 22, Sector 12, Khalifa City A", landmark: "Near Al Forsan" },
  { name: "Zainab Qureshi", email: `zainab.qureshi@${DEMO_DOMAIN}`, phone: "971585556677", emirate: "Ajman", city: "Al Rashidiya", line: "Flat 405, Horizon Tower, Al Rashidiya 3", landmark: null },
  { name: "Noor Siddiqui", email: `noor.siddiqui@${DEMO_DOMAIN}`, phone: "971526667788", emirate: "Dubai", city: "Mirdif", line: "Villa 7, Street 19, Uptown Mirdif", landmark: "Near Uptown Mirdif mall" },
  { name: "Sara Khan", email: `sara.khan@${DEMO_DOMAIN}`, phone: "971507778899", emirate: "Ras Al Khaimah", city: "Al Nakheel", line: "Flat 1102, Julphar Towers", landmark: null },
  { name: "Layla Ahmed", email: `layla.ahmed@${DEMO_DOMAIN}`, phone: "971558889900", emirate: "Dubai", city: "Business Bay", line: "Flat 2308, Executive Towers, Tower J", landmark: "Bay Avenue" },
] as const;

const COURIERS = ["Aramex", "Emirates Post"] as const;

const NOTES = [
  null,
  null,
  null,
  "Please call before delivery.",
  "Leave with the security desk if I am out.",
  "Gift — no invoice inside the parcel please.",
] as const;

// ---------------------------------------------------------------------------
// Remove
// ---------------------------------------------------------------------------

async function remove(): Promise<void> {
  const orders = await prisma.order.deleteMany({
    where: { customerEmail: { endsWith: `@${DEMO_DOMAIN}` } },
  });
  const users = await prisma.user.deleteMany({
    where: { email: { endsWith: `@${DEMO_DOMAIN}` } },
  });
  const audits = await prisma.auditLog.deleteMany({ where: { ipAddress: DEMO_IP } });
  console.log(`removed ${orders.count} orders, ${users.count} customers, ${audits.count} audit rows`);
}

// ---------------------------------------------------------------------------
// Add
// ---------------------------------------------------------------------------

async function nextOrderNumber(): Promise<string> {
  const year = String(new Date().getFullYear()).slice(-2);
  const [row] = await prisma.$queryRawUnsafe<{ nextval: bigint }[]>(
    `SELECT nextval('feezee_order_number') AS nextval`,
  );
  return `FZ-${year}-${row!.nextval}-${suffix()}`;
}

type Money = { subtotalAed: number; shippingFeeAed: number; vatAed: number; totalAed: number };

function totals(lines: { unitPriceAed: number; quantity: number }[]): Money {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPriceAed * l.quantity, 0);
  const shipping =
    subtotal >= DEFAULT_SETTINGS.freeShippingThresholdAed ? 0 : DEFAULT_SETTINGS.standardShippingFeeAed;
  const vat = Math.round((subtotal + shipping) * DEFAULT_SETTINGS.vatRate * 100) / 100;
  return {
    subtotalAed: subtotal,
    shippingFeeAed: shipping,
    vatAed: vat,
    totalAed: Math.round((subtotal + shipping + vat) * 100) / 100,
  };
}

type Plan = {
  daysAgo: number;
  fulfillment: "PENDING" | "PROCESSING" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
  method: "STRIPE" | "COD" | "BANK_TRANSFER";
};

/**
 * A month of trade, oldest first. Enough delivered orders to give the chart a
 * shape and the best-sellers a list, and one or two of everything else so every
 * status chip, filter and panel in the back office has something to show.
 */
const PLAN: Plan[] = [
  { daysAgo: 29, fulfillment: "DELIVERED", method: "STRIPE" },
  { daysAgo: 28, fulfillment: "DELIVERED", method: "COD" },
  { daysAgo: 27, fulfillment: "DELIVERED", method: "STRIPE" },
  { daysAgo: 25, fulfillment: "DELIVERED", method: "BANK_TRANSFER" },
  { daysAgo: 24, fulfillment: "CANCELLED", method: "STRIPE" },
  { daysAgo: 23, fulfillment: "DELIVERED", method: "STRIPE" },
  { daysAgo: 22, fulfillment: "DELIVERED", method: "COD" },
  { daysAgo: 20, fulfillment: "DELIVERED", method: "STRIPE" },
  { daysAgo: 19, fulfillment: "DELIVERED", method: "STRIPE" },
  { daysAgo: 18, fulfillment: "DELIVERED", method: "COD" },
  { daysAgo: 16, fulfillment: "DELIVERED", method: "STRIPE" },
  { daysAgo: 15, fulfillment: "DELIVERED", method: "BANK_TRANSFER" },
  { daysAgo: 14, fulfillment: "DELIVERED", method: "STRIPE" },
  { daysAgo: 12, fulfillment: "DELIVERED", method: "STRIPE" },
  { daysAgo: 11, fulfillment: "CANCELLED", method: "COD" },
  { daysAgo: 10, fulfillment: "DELIVERED", method: "STRIPE" },
  { daysAgo: 9, fulfillment: "DELIVERED", method: "COD" },
  { daysAgo: 8, fulfillment: "DELIVERED", method: "STRIPE" },
  { daysAgo: 6, fulfillment: "DELIVERED", method: "STRIPE" },
  { daysAgo: 5, fulfillment: "DISPATCHED", method: "STRIPE" },
  { daysAgo: 4, fulfillment: "DISPATCHED", method: "COD" },
  { daysAgo: 3, fulfillment: "DISPATCHED", method: "STRIPE" },
  { daysAgo: 2, fulfillment: "PROCESSING", method: "STRIPE" },
  { daysAgo: 2, fulfillment: "PROCESSING", method: "BANK_TRANSFER" },
  { daysAgo: 1, fulfillment: "PROCESSING", method: "COD" },
  { daysAgo: 1, fulfillment: "PENDING", method: "STRIPE" },
  { daysAgo: 0, fulfillment: "PENDING", method: "COD" },
  { daysAgo: 0, fulfillment: "PENDING", method: "BANK_TRANSFER" },
  { daysAgo: 0, fulfillment: "PENDING", method: "STRIPE" },
];

async function add(): Promise<void> {
  await remove();

  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL }, select: { id: true } });

  // Customers -------------------------------------------------------------
  const passwordHash = await bcrypt.hash("DemoCustomer2026!", 10);
  const users = new Map<string, string>();
  for (const [i, c] of CUSTOMERS.entries()) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        name: c.name,
        phone: c.phone,
        passwordHash,
        role: "CUSTOMER",
        createdAt: at(45 - i * 4),
        addresses: {
          create: {
            fullName: c.name,
            phone: c.phone,
            emirate: c.emirate,
            city: c.city,
            addressLine1: c.line,
            landmark: c.landmark,
            isDefault: true,
          },
        },
      },
    });
    users.set(c.email, user.id);
  }

  // The catalogue as it stands ----------------------------------------------
  const products = await prisma.product.findMany({
    where: { isArchived: false },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: true,
    },
  });
  if (products.length === 0) throw new Error("No products to sell — run db:seed first.");

  // Orders ------------------------------------------------------------------
  type Made = { id: string; orderNumber: string; customerEmail: string; customerName: string; placedAt: Date; items: { id: string; unitPriceAed: number; quantity: number }[]; method: Plan["method"]; fulfillment: Plan["fulfillment"] };
  const made: Made[] = [];
  const audits: { action: string; entityType: string; entityId: string; previousState?: object; newState?: object; createdAt: Date }[] = [];

  for (const plan of PLAN) {
    const customer = pick(CUSTOMERS);
    const placedAt = at(plan.daysAgo);

    const lineCount = between(1, 3);
    const chosen = new Set<number>();
    const lines: { productName: string; variantId: string; variantSize: string; sku: string; unitPriceAed: number; quantity: number; totalAed: number; image: string }[] = [];
    while (lines.length < lineCount) {
      const product = pick(products);
      if (chosen.has(product.id)) continue;
      // The middle sizes, which is what mostly sells; any size if a piece has none.
      const sized = product.variants.filter((v) => ["S", "M", "L"].includes(v.size));
      const variant = pick(sized.length > 0 ? sized : product.variants);
      if (!variant) continue;
      chosen.add(product.id);
      const quantity = rand() < 0.8 ? 1 : 2;
      const unit = Number(product.aed);
      lines.push({
        productName: product.name,
        variantId: variant.id,
        variantSize: variant.size,
        sku: variant.sku,
        unitPriceAed: unit,
        quantity,
        totalAed: unit * quantity,
        image: product.images[0]?.url ?? "",
      });
    }

    const money = totals(lines);
    const orderNumber = await nextOrderNumber();

    const dispatchedAt = ["DISPATCHED", "DELIVERED"].includes(plan.fulfillment) ? new Date(placedAt.getTime() + between(20, 40) * 60 * 60 * 1000) : null;
    const deliveredAt = plan.fulfillment === "DELIVERED" && dispatchedAt ? new Date(dispatchedAt.getTime() + between(24, 60) * 60 * 60 * 1000) : null;
    const cancelledAt = plan.fulfillment === "CANCELLED" ? new Date(placedAt.getTime() + between(2, 30) * 60 * 60 * 1000) : null;

    // Card is paid at checkout; cash is paid at the door; a transfer lands a day or so later.
    let paymentStatus: "PENDING" | "PAID" | "REFUNDED" | "FAILED" = "PENDING";
    let paidAt: Date | null = null;
    if (plan.method === "STRIPE") {
      paymentStatus = plan.fulfillment === "CANCELLED" ? "REFUNDED" : "PAID";
      paidAt = placedAt;
    } else if (plan.method === "COD") {
      if (deliveredAt) { paymentStatus = "PAID"; paidAt = deliveredAt; }
      if (plan.fulfillment === "CANCELLED") paymentStatus = "FAILED";
    } else {
      if (plan.daysAgo >= 2 && plan.fulfillment !== "PENDING") { paymentStatus = "PAID"; paidAt = new Date(placedAt.getTime() + between(6, 30) * 60 * 60 * 1000); }
    }

    const courierName = dispatchedAt ? pick(COURIERS) : null;
    const trackingNumber = dispatchedAt ? String(between(40_000_000_000, 49_999_999_999)) : null;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: users.get(customer.email) ?? null,
        customerEmail: customer.email,
        customerName: customer.name,
        customerPhone: customer.phone,
        ...money,
        paymentMethod: plan.method,
        paymentStatus,
        fulfillmentStatus: plan.fulfillment,
        shippingEmirate: customer.emirate,
        shippingCity: customer.city,
        shippingAddressLine: customer.line,
        shippingLandmark: customer.landmark,
        shippingNotes: pick(NOTES),
        courierName,
        trackingNumber,
        trackingUrl: trackingNumber
          ? courierName === "Aramex"
            ? `https://www.aramex.com/track/results?ShipmentNumber=${trackingNumber}`
            : `https://www.emiratespost.ae/track?number=${trackingNumber}`
          : null,
        placedAt,
        createdAt: placedAt,
        paidAt,
        dispatchedAt,
        deliveredAt,
        cancelledAt,
        items: { create: lines },
        transactions: {
          create: [
            {
              provider: plan.method === "STRIPE" ? "STRIPE" : plan.method,
              transactionId: plan.method === "STRIPE" ? `pi_demo_${suffix()}${suffix()}` : null,
              amountAed: money.totalAed,
              status: plan.method === "STRIPE" ? "PAID" : "PENDING",
              createdAt: placedAt,
              metadata: { demo: true },
            },
            ...(plan.method !== "STRIPE" && paymentStatus === "PAID" && paidAt
              ? [{ provider: "MANUAL", transactionId: null, amountAed: money.totalAed, status: "PAID", createdAt: paidAt, metadata: { markedBy: ADMIN_EMAIL, demo: true } }]
              : []),
            ...(plan.method === "STRIPE" && paymentStatus === "REFUNDED" && cancelledAt
              ? [{ provider: "STRIPE", transactionId: `re_demo_${suffix()}${suffix()}`, amountAed: money.totalAed, status: "REFUNDED", createdAt: cancelledAt, metadata: { demo: true } }]
              : []),
          ],
        },
      },
      include: { items: true },
    });

    made.push({
      id: order.id,
      orderNumber,
      customerEmail: customer.email,
      customerName: customer.name,
      placedAt,
      items: order.items.map((i) => ({ id: i.id, unitPriceAed: Number(i.unitPriceAed), quantity: i.quantity })),
      method: plan.method,
      fulfillment: plan.fulfillment,
    });

    // What the back office would have logged along the way.
    if (["PROCESSING", "DISPATCHED", "DELIVERED"].includes(plan.fulfillment)) {
      audits.push({ action: "order.processing", entityType: "Order", entityId: orderNumber, previousState: { fulfillmentStatus: "PENDING" }, newState: { fulfillmentStatus: "PROCESSING" }, createdAt: new Date(placedAt.getTime() + between(1, 8) * 60 * 60 * 1000) });
    }
    if (dispatchedAt) {
      audits.push({ action: "order.dispatched", entityType: "Order", entityId: orderNumber, previousState: { fulfillmentStatus: "PROCESSING" }, newState: { fulfillmentStatus: "DISPATCHED", courierName, trackingNumber }, createdAt: dispatchedAt });
    }
    if (deliveredAt) {
      audits.push({ action: "order.delivered", entityType: "Order", entityId: orderNumber, previousState: { fulfillmentStatus: "DISPATCHED" }, newState: { fulfillmentStatus: "DELIVERED" }, createdAt: deliveredAt });
    }
    if (cancelledAt) {
      audits.push({ action: "order.cancelled", entityType: "Order", entityId: orderNumber, previousState: { fulfillmentStatus: "PENDING" }, newState: { fulfillmentStatus: "CANCELLED" }, createdAt: cancelledAt });
    }
    if (plan.method !== "STRIPE" && paymentStatus === "PAID" && paidAt) {
      audits.push({ action: "order.payment", entityType: "Order", entityId: orderNumber, previousState: { paymentStatus: "PENDING" }, newState: { paymentStatus: "PAID" }, createdAt: paidAt });
    }
  }

  // Returns -----------------------------------------------------------------
  const delivered = made.filter((o) => o.fulfillment === "DELIVERED").sort((a, b) => a.placedAt.getTime() - b.placedAt.getTime());
  const returnPlans: { status: "PENDING" | "APPROVED" | "RECEIVED" | "REFUNDED" | "REJECTED"; reason: string; customerNotes: string | null; adminNotes: string | null; restock: boolean; condition: string | null }[] = [
    { status: "REFUNDED", reason: "Wrong size", customerNotes: "The M came up small — I would normally take a M in lawn.", adminNotes: "Refunded in full. Piece came back unworn with tags.", restock: true, condition: "Unworn, tags attached" },
    { status: "RECEIVED", reason: "Changed my mind", customerNotes: null, adminNotes: "Arrived at the shop Tuesday. Checking it over before we refund.", restock: false, condition: "Unworn" },
    { status: "APPROVED", reason: "Damaged on arrival", customerNotes: "There is a pull in the fabric on the front of the shirt.", adminNotes: "Post to Shop 1-35, Madina Mall. We refund within two working days of it arriving.", restock: false, condition: null },
    { status: "PENDING", reason: "Wrong size", customerNotes: "Ordered a L, need an XL please.", adminNotes: null, restock: false, condition: null },
    { status: "REJECTED", reason: "Changed my mind", customerNotes: null, adminNotes: "Outside the 14-day window, sorry — the order was delivered three weeks before the request.", restock: false, condition: null },
  ];

  for (const [i, plan] of returnPlans.entries()) {
    // Recent deliveries for the open ones, an old one for the rejection.
    const order = plan.status === "REJECTED" ? delivered[0] : delivered[delivered.length - 1 - i];
    if (!order) break;
    const item = order.items[0]!;
    const requestedAt = plan.status === "REJECTED"
      ? new Date(order.placedAt.getTime() + 24 * DAY)
      : new Date(order.placedAt.getTime() + between(3, 6) * DAY);
    const resolvedAt = ["REFUNDED", "REJECTED"].includes(plan.status) ? new Date(requestedAt.getTime() + between(1, 3) * DAY) : null;
    const refund = item.unitPriceAed * item.quantity;
    const returnNumber = `RET-${order.orderNumber}-1`;

    await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        returnNumber,
        status: plan.status,
        reason: plan.reason,
        customerNotes: plan.customerNotes,
        adminNotes: plan.adminNotes,
        refundAmountAed: plan.status === "REFUNDED" ? refund : null,
        isRestocked: plan.restock,
        requestedAt,
        createdAt: requestedAt,
        resolvedAt,
        items: { create: [{ orderItemId: item.id, quantity: item.quantity, reason: plan.reason, condition: plan.condition }] },
      },
    });

    const steps: Array<[string, string, Date]> = [];
    const t = (d: number) => new Date(requestedAt.getTime() + d * 60 * 60 * 1000);
    if (["APPROVED", "RECEIVED", "REFUNDED"].includes(plan.status)) steps.push(["PENDING", "APPROVED", t(between(2, 20))]);
    if (["RECEIVED", "REFUNDED"].includes(plan.status)) steps.push(["APPROVED", "RECEIVED", t(between(30, 70))]);
    if (plan.status === "REFUNDED") steps.push(["RECEIVED", "REFUNDED", resolvedAt ?? t(80)]);
    if (plan.status === "REJECTED") steps.push(["PENDING", "REJECTED", resolvedAt ?? t(10)]);
    for (const [from, to, when] of steps) {
      audits.push({
        action: `return.${to.toLowerCase()}`,
        entityType: "ReturnRequest",
        entityId: returnNumber,
        previousState: { status: from, isRestocked: false },
        newState: { status: to, isRestocked: to === "REFUNDED" && plan.restock, ...(to === "REFUNDED" ? { refundAmountAed: refund } : {}) },
        createdAt: when,
      });
    }
  }

  // A little catalogue and stock history, so the log is not only orders ------
  const sample = products.slice(0, 3);
  if (sample[0]) {
    const p = sample[0];
    const was = Number(p.aed);
    audits.push({ action: "product.put_on_sale", entityType: "Product", entityId: String(p.id), previousState: { aed: was, wasAed: null, badgeLabel: null, badgeTone: null }, newState: { aed: Math.round(was * 0.7), wasAed: was, badgeLabel: "30% Off", badgeTone: "wine" }, createdAt: at(13, 11) });
    audits.push({ action: "product.remove_from_sale", entityType: "Product", entityId: String(p.id), previousState: { aed: Math.round(was * 0.7), wasAed: was, badgeLabel: "30% Off", badgeTone: "wine" }, newState: { aed: was, wasAed: null, badgeLabel: null, badgeTone: null }, createdAt: at(6, 10) });
  }
  if (sample[1]) {
    const v = sample[1].variants.find((x) => x.size === "M") ?? sample[1].variants[0]!;
    audits.push({ action: "inventory.adjust", entityType: "ProductVariant", entityId: v.id, previousState: { stock: Math.max(0, v.stock - 6) }, newState: { stock: v.stock, delta: 6, reason: "RESTOCK", note: "Batch in from the workshop" }, createdAt: at(17, 12) });
  }
  if (sample[2]) {
    audits.push({ action: "product.update", entityType: "Product", entityId: String(sample[2].id), newState: { name: sample[2].name, collection: sample[2].collection, aed: Number(sample[2].aed), isArchived: false }, createdAt: at(21, 15) });
  }

  await prisma.auditLog.createMany({
    data: audits.map((a) => ({
      userId: admin?.id ?? null,
      userEmail: ADMIN_EMAIL,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      previousState: a.previousState,
      newState: a.newState,
      ipAddress: DEMO_IP,
      createdAt: a.createdAt,
    })),
  });

  console.log(`added ${CUSTOMERS.length} customers, ${made.length} orders, ${returnPlans.length} returns, ${audits.length} audit rows`);
  console.log(`remove them again with: npm run demo:remove`);
}

// ---------------------------------------------------------------------------

const mode = process.argv[2] === "--remove" ? "remove" : "add";
(mode === "remove" ? remove() : add())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
