import "server-only";
import {
  FulfillmentStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  StockReason,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toAed, toDecimal } from "@/modules/shared/money";
import { getSettings } from "@/modules/shared/settings";
import { calculateTotals, formatAddressLine } from "@/modules/checkout";
import type { CheckoutDetails } from "@/modules/checkout";
import { deductMany, restock } from "@/modules/inventory";
import { createStripeRefund } from "@/modules/payments/stripe";
import { trackingUrlFor, transitFor } from "@/modules/shipping";
import type { OrderTotals } from "@/modules/checkout";

/**
 * Placing, reading and moving an order.
 *
 * The rule the whole module is built around: **the browser never sends a
 * price.** A basket arriving from a client is a list of variant ids and
 * quantities, nothing more. Everything on the invoice — the unit price, the
 * VAT, the delivery charge — is read or computed here, from the database and
 * the store settings. A tampered request can change what someone buys; it can
 * never change what they pay.
 */

export type BasketLine = { variantId: string; quantity: number };

export class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutError";
  }
}

// ---------------------------------------------------------------------------
// Order numbers
// ---------------------------------------------------------------------------

const SEQUENCE = "feezee_order_number";

/**
 * `FZ-26-1001`, and never the same one twice.
 *
 * A Postgres sequence rather than `max(orderNumber) + 1`: `nextval` is not
 * transactional, so two checkouts running at the same instant get two different
 * numbers without either blocking or retrying. The cost is a gap in the run
 * when an order is rolled back, which is the right trade — a missing number is
 * an accounting curiosity, a duplicate one is a support incident.
 */
export async function nextOrderNumber(): Promise<string> {
  const year = String(new Date().getFullYear()).slice(-2);

  let value: bigint;
  try {
    const [row] = await prisma.$queryRawUnsafe<{ nextval: bigint }[]>(
      `SELECT nextval('${SEQUENCE}') AS nextval`,
    );
    value = row.nextval;
  } catch {
    // First run on a database seeded before the sequence existed.
    await prisma.$executeRawUnsafe(
      `CREATE SEQUENCE IF NOT EXISTS ${SEQUENCE} START WITH 1001 INCREMENT BY 1`,
    );
    const [row] = await prisma.$queryRawUnsafe<{ nextval: bigint }[]>(
      `SELECT nextval('${SEQUENCE}') AS nextval`,
    );
    value = row.nextval;
  }

  return `FZ-${year}-${String(value).padStart(4, "0")}`;
}

// ---------------------------------------------------------------------------
// Pricing a basket
// ---------------------------------------------------------------------------

export type PricedLine = {
  variantId: string;
  productId: number;
  slug: string;
  productName: string;
  size: string;
  sku: string;
  image: string;
  unitPriceAed: number;
  quantity: number;
  totalAed: number;
  /** Stock on hand right now — how the cart warns before the order is placed. */
  available: number;
};

export type PricedBasket = {
  lines: PricedLine[];
  totals: OrderTotals;
  /** Lines dropped because the garment has left the catalogue. */
  removed: string[];
  /** Lines whose quantity had to come down to what is left. */
  adjusted: { label: string; requested: number; available: number }[];
};

/**
 * Turn a basket of variant ids into money.
 *
 * Also the cart's reality check: anything archived is dropped, anything short
 * is trimmed to what is on the rail, and both are reported so the page can say
 * what changed rather than silently altering the order.
 */
export async function priceBasket(
  lines: readonly BasketLine[],
): Promise<PricedBasket> {
  const settings = await getSettings();
  const ids = [...new Set(lines.map((l) => l.variantId))];

  const variants = ids.length
    ? await prisma.productVariant.findMany({
        where: { id: { in: ids } },
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
          },
        },
      })
    : [];

  const byId = new Map(variants.map((v) => [v.id, v]));

  const priced: PricedLine[] = [];
  const removed: string[] = [];
  const adjusted: PricedBasket["adjusted"] = [];

  for (const line of lines) {
    const variant = byId.get(line.variantId);
    if (!variant || variant.product.isArchived) {
      removed.push(variant?.product.name ?? "A piece in your bag");
      continue;
    }

    const label = `${variant.product.name} (${variant.size})`;
    const quantity = Math.min(Math.max(1, line.quantity), variant.stock);

    if (variant.stock <= 0) {
      removed.push(label);
      continue;
    }
    if (quantity < line.quantity) {
      adjusted.push({ label, requested: line.quantity, available: variant.stock });
    }

    const unitPriceAed = toAed(variant.priceAed ?? variant.product.aed);

    priced.push({
      variantId: variant.id,
      productId: variant.productId,
      slug: variant.product.slug,
      productName: variant.product.name,
      size: variant.size,
      sku: variant.sku,
      image: variant.product.images[0]?.url ?? "",
      unitPriceAed,
      quantity,
      totalAed: unitPriceAed * quantity,
      available: variant.stock,
    });
  }

  return {
    lines: priced,
    totals: calculateTotals(priced, settings),
    removed,
    adjusted,
  };
}

// ---------------------------------------------------------------------------
// Placing an order
// ---------------------------------------------------------------------------

export type PlaceOrderInput = {
  lines: readonly BasketLine[];
  details: CheckoutDetails;
  userId?: string | null;
};

export type PlacedOrder = {
  id: string;
  orderNumber: string;
  totals: OrderTotals;
  paymentMethod: PaymentMethod;
  customerEmail: string;
};

/**
 * Write the order and take the stock, or do neither.
 *
 * One interactive transaction covers both: `deductMany` throws `OutOfStockError`
 * the moment a line cannot be served, which rolls the order back with it. There
 * is no window in which stock is gone and no order exists to explain it.
 *
 * The payment provider is *not* called in here. A card sheet is a network round
 * trip to another company, and holding row locks across one is how a slow
 * Stripe response turns into a shop that cannot sell anything. The order is
 * written as PENDING first; payment is started immediately after.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  const basket = await priceBasket(input.lines);

  if (basket.lines.length === 0) {
    throw new CheckoutError(
      "There is nothing left in your bag that we can ship. Please add a piece and try again.",
    );
  }
  if (basket.removed.length > 0 || basket.adjusted.length > 0) {
    throw new CheckoutError(
      "Your bag changed while you were checking out. Please review it and place the order again.",
    );
  }

  const { details } = input;
  const orderNumber = await nextOrderNumber();
  const { totals } = basket;

  const order = await prisma.$transaction(async (tx) => {
    await deductMany(
      tx,
      basket.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      { note: `Order ${orderNumber}`, userId: input.userId ?? null },
    );

    return tx.order.create({
      data: {
        orderNumber,
        userId: input.userId ?? null,
        customerEmail: details.email.toLowerCase(),
        customerName: details.fullName,
        customerPhone: details.phone,

        subtotalAed: toDecimal(totals.subtotalAed),
        shippingFeeAed: toDecimal(totals.shippingFeeAed),
        vatAed: toDecimal(totals.vatAed),
        totalAed: toDecimal(totals.totalAed),

        paymentMethod: details.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        fulfillmentStatus: FulfillmentStatus.PENDING,

        shippingEmirate: details.emirate,
        shippingCity: details.city,
        shippingAddressLine: formatAddressLine(details),
        shippingLandmark: details.landmark || null,
        shippingNotes: details.notes || null,

        items: {
          create: basket.lines.map((line) => ({
            variantId: line.variantId,
            productName: line.productName,
            variantSize: line.size,
            sku: line.sku,
            unitPriceAed: toDecimal(line.unitPriceAed),
            quantity: line.quantity,
            totalAed: toDecimal(line.totalAed),
            image: line.image,
          })),
        },
      },
    });
  });

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    totals,
    paymentMethod: order.paymentMethod,
    customerEmail: order.customerEmail,
  };
}

// ---------------------------------------------------------------------------
// Reading orders
// ---------------------------------------------------------------------------

const orderInclude = {
  items: true,
  transactions: { orderBy: { createdAt: "desc" } },
  returns: { orderBy: { requestedAt: "desc" } },
} as const;

export type OrderView = ReturnType<typeof toOrderView>;

function toOrderView(
  row: Prisma.OrderGetPayload<{ include: typeof orderInclude }>,
) {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    userId: row.userId,
    customerEmail: row.customerEmail,
    customerName: row.customerName,
    customerPhone: row.customerPhone,

    subtotalAed: toAed(row.subtotalAed),
    shippingFeeAed: toAed(row.shippingFeeAed),
    vatAed: toAed(row.vatAed),
    totalAed: toAed(row.totalAed),
    currency: row.currency,

    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    fulfillmentStatus: row.fulfillmentStatus,

    shippingEmirate: row.shippingEmirate,
    shippingCity: row.shippingCity,
    shippingAddressLine: row.shippingAddressLine,
    shippingLandmark: row.shippingLandmark,
    shippingNotes: row.shippingNotes,

    courierName: row.courierName,
    trackingNumber: row.trackingNumber,
    trackingUrl:
      row.trackingUrl ?? trackingUrlFor(row.courierName, row.trackingNumber),

    placedAt: row.placedAt.toISOString(),
    paidAt: row.paidAt?.toISOString() ?? null,
    dispatchedAt: row.dispatchedAt?.toISOString() ?? null,
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,

    items: row.items.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      productName: item.productName,
      variantSize: item.variantSize,
      sku: item.sku,
      unitPriceAed: toAed(item.unitPriceAed),
      quantity: item.quantity,
      totalAed: toAed(item.totalAed),
      image: item.image,
    })),

    transactions: row.transactions.map((t) => ({
      id: t.id,
      provider: t.provider,
      transactionId: t.transactionId,
      amountAed: toAed(t.amountAed),
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    })),

    returns: row.returns.map((r) => ({
      id: r.id,
      returnNumber: r.returnNumber,
      status: r.status,
      requestedAt: r.requestedAt.toISOString(),
    })),
  };
}

export async function orderByNumber(orderNumber: string) {
  const row = await prisma.order.findUnique({
    where: { orderNumber },
    include: orderInclude,
  });
  return row ? toOrderView(row) : null;
}

export async function orderById(id: string) {
  const row = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  return row ? toOrderView(row) : null;
}

// ---------------------------------------------------------------------------
// Guest order tracking
// ---------------------------------------------------------------------------

/**
 * What a stranger holding an order number is shown.
 *
 * A deliberately smaller thing than `OrderView`: no `userId`, no payment
 * transactions, no street address, no phone. Order numbers run in a sequence
 * and are therefore guessable, so the email is the whole of the gate — and
 * what is behind the gate should still be only what the confirmation email
 * already told them.
 */
export type TrackedOrder = {
  orderNumber: string;
  customerName: string;
  placedAt: string;
  paidAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  paymentMethod: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  courierName: string | null;
  courierTransit: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippingCity: string;
  shippingEmirate: string;
  subtotalAed: number;
  shippingFeeAed: number;
  vatAed: number;
  totalAed: number;
  items: {
    id: string;
    productName: string;
    variantSize: string;
    sku: string;
    quantity: number;
    unitPriceAed: number;
    totalAed: number;
    image: string;
  }[];
};

/**
 * Find an order for the public tracking page, or nothing.
 *
 * Both failures — no such order, and an email that does not match — return
 * null rather than different answers. A page that said "that order exists but
 * the email is wrong" would turn a guessable order number into a way of
 * confirming that someone shopped here.
 *
 * The order number is matched case-insensitively and without its spaces, since
 * `FZ-26-1001` is read off an email and typed by hand.
 */
export async function trackOrder(
  orderNumber: string,
  email: string,
): Promise<TrackedOrder | null> {
  const number = orderNumber.trim().replace(/\s+/g, "").toUpperCase();
  const address = email.trim().toLowerCase();
  if (!number || !address) return null;

  const row = await prisma.order.findUnique({
    where: { orderNumber: number },
    include: { items: true },
  });

  if (!row || row.customerEmail.toLowerCase() !== address) return null;

  return {
    orderNumber: row.orderNumber,
    customerName: row.customerName,
    placedAt: row.placedAt.toISOString(),
    paidAt: row.paidAt?.toISOString() ?? null,
    dispatchedAt: row.dispatchedAt?.toISOString() ?? null,
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    fulfillmentStatus: row.fulfillmentStatus,
    courierName: row.courierName,
    courierTransit: transitFor(row.courierName),
    trackingNumber: row.trackingNumber,
    trackingUrl:
      row.trackingUrl ?? trackingUrlFor(row.courierName, row.trackingNumber),
    shippingCity: row.shippingCity,
    shippingEmirate: row.shippingEmirate,
    subtotalAed: toAed(row.subtotalAed),
    shippingFeeAed: toAed(row.shippingFeeAed),
    vatAed: toAed(row.vatAed),
    totalAed: toAed(row.totalAed),
    items: row.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      variantSize: item.variantSize,
      sku: item.sku,
      quantity: item.quantity,
      unitPriceAed: toAed(item.unitPriceAed),
      totalAed: toAed(item.totalAed),
      image: item.image,
    })),
  };
}

/** A customer's own orders, newest first. */
export async function ordersForUser(userId: string) {
  const rows = await prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { placedAt: "desc" },
  });
  return rows.map(toOrderView);
}

export type OrderFilter = {
  fulfillmentStatus?: FulfillmentStatus;
  paymentStatus?: PaymentStatus;
  emirate?: string;
  search?: string;
  from?: Date;
  to?: Date;
  take?: number;
  skip?: number;
};

/** The admin's order list. */
export async function listOrders(filter: OrderFilter = {}) {
  const where: Prisma.OrderWhereInput = {
    ...(filter.fulfillmentStatus
      ? { fulfillmentStatus: filter.fulfillmentStatus }
      : {}),
    ...(filter.paymentStatus ? { paymentStatus: filter.paymentStatus } : {}),
    ...(filter.emirate ? { shippingEmirate: filter.emirate } : {}),
    ...(filter.from || filter.to
      ? {
          placedAt: {
            ...(filter.from ? { gte: filter.from } : {}),
            ...(filter.to ? { lte: filter.to } : {}),
          },
        }
      : {}),
    ...(filter.search
      ? {
          OR: [
            { orderNumber: { contains: filter.search, mode: "insensitive" } },
            { customerEmail: { contains: filter.search, mode: "insensitive" } },
            { customerName: { contains: filter.search, mode: "insensitive" } },
            { customerPhone: { contains: filter.search } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { placedAt: "desc" },
      take: filter.take ?? 50,
      skip: filter.skip ?? 0,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders: rows.map(toOrderView), total };
}

// ---------------------------------------------------------------------------
// Moving an order along
// ---------------------------------------------------------------------------

/**
 * Which transitions are legal.
 *
 * Written out rather than inferred, because the illegal ones matter more than
 * the legal ones: an order cannot go back to PENDING once it has shipped, and
 * a DELIVERED order cannot be cancelled — that is a return, and returns restock
 * on their own terms.
 */
const TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  PENDING: ["PROCESSING", "DISPATCHED", "CANCELLED"],
  PROCESSING: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(
  from: FulfillmentStatus,
  to: FulfillmentStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: FulfillmentStatus): FulfillmentStatus[] {
  return TRANSITIONS[from];
}

export type FulfillmentUpdate = {
  status: FulfillmentStatus;
  courierName?: string | null;
  trackingNumber?: string | null;
};

/**
 * Move an order to a new fulfillment status.
 *
 * Cancellation is the one that does real work: every line goes back on the
 * rail, inside the same transaction that flips the status, so an order can
 * never end up cancelled with its stock still held.
 */
export async function updateFulfillment(
  orderId: string,
  update: FulfillmentUpdate,
  actorId?: string | null,
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });

    if (current.fulfillmentStatus === update.status) {
      return toOrderView(
        await tx.order.findUniqueOrThrow({
          where: { id: orderId },
          include: orderInclude,
        }),
      );
    }

    if (!canTransition(current.fulfillmentStatus, update.status)) {
      throw new CheckoutError(
        `An order that is ${current.fulfillmentStatus.toLowerCase()} cannot become ${update.status.toLowerCase()}.`,
      );
    }

    const now = new Date();
    const data: Prisma.OrderUpdateInput = { fulfillmentStatus: update.status };

    if (update.status === "DISPATCHED") {
      if (!update.courierName || !update.trackingNumber) {
        throw new CheckoutError(
          "A courier and a tracking number are needed to dispatch an order.",
        );
      }
      data.dispatchedAt = now;
      data.courierName = update.courierName;
      data.trackingNumber = update.trackingNumber;
      data.trackingUrl = trackingUrlFor(update.courierName, update.trackingNumber);
    }

    if (update.status === "DELIVERED") {
      data.deliveredAt = now;
      // Cash is collected at the door, so delivery is also the moment a COD
      // order becomes paid.
      if (
        current.paymentMethod === PaymentMethod.COD &&
        current.paymentStatus === PaymentStatus.PENDING
      ) {
        data.paymentStatus = PaymentStatus.PAID;
        data.paidAt = now;
      }
    }

    if (update.status === "CANCELLED") {
      data.cancelledAt = now;
      for (const item of current.items) {
        if (!item.variantId) continue;
        await restock(tx, item.variantId, item.quantity, StockReason.ORDER_CANCELLED, {
          note: `Order ${current.orderNumber} cancelled`,
          userId: actorId ?? null,
        });
      }
    }

    await tx.order.update({ where: { id: orderId }, data });

    return toOrderView(
      await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: orderInclude,
      }),
    );
  });
}

/** Record a payment outcome, and the transaction row that evidences it. */
export async function recordPayment(
  orderId: string,
  input: {
    provider: string;
    transactionId: string | null;
    amountAed: number;
    status: PaymentStatus;
    metadata?: Prisma.InputJsonValue;
  },
) {
  return prisma.$transaction(async (tx) => {
    await tx.paymentTransaction.create({
      data: {
        orderId,
        provider: input.provider,
        transactionId: input.transactionId,
        amountAed: toDecimal(input.amountAed),
        status: input.status,
        ...(input.metadata ? { metadata: input.metadata } : {}),
      },
    });

    return tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: input.status,
        ...(input.status === PaymentStatus.PAID ? { paidAt: new Date() } : {}),
        // A paid order is one the workshop can start on.
        ...(input.status === PaymentStatus.PAID
          ? { fulfillmentStatus: FulfillmentStatus.PROCESSING }
          : {}),
      },
    });
  });
}

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

/** The provider written on a refund row, so it never reads as a payment. */
export const STRIPE_REFUND_PROVIDER = "STRIPE_REFUND";

export type RefundOutcome =
  /** Money is on its way back, and the transaction row says so. */
  | {
      kind: "refunded";
      refundId: string;
      paymentIntentId: string;
      amountAed: number;
      stripeStatus: string;
    }
  /** The same refund had already been made — Stripe replayed it. */
  | { kind: "already"; refundId: string | null }
  /** Nothing to call: cash, a transfer, or a card charge we cannot find. */
  | { kind: "manual"; reason: string };

/**
 * Send a card payment back, and write down that it happened.
 *
 * Deliberately outside `resolveReturn`'s transaction. A refund is an HTTP call
 * to another company; holding a row lock across one is how a slow Stripe
 * response becomes a locked order table, and a transaction that rolls back
 * after Stripe has said yes does not un-send the money.
 *
 * The `reference` is the return number, and it is doing two jobs: it is the
 * Stripe idempotency key, so a form saved twice refunds once, and it is what
 * ties the transaction row back to the return that caused it.
 */
export async function refundStripePayment(
  orderId: string,
  amountAed: number,
  reference: string,
): Promise<RefundOutcome> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    select: {
      orderNumber: true,
      paymentMethod: true,
      transactions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (order.paymentMethod === PaymentMethod.COD) {
    return {
      kind: "manual",
      reason: "Cash on delivery — hand the refund back or transfer it yourself.",
    };
  }
  if (order.paymentMethod === PaymentMethod.BANK_TRANSFER) {
    return {
      kind: "manual",
      reason: "Paid by bank transfer — send the payout from the shop account.",
    };
  }

  // A refund already recorded against this same return is not made again, even
  // if Stripe would have replayed it for us.
  const existing = order.transactions.find(
    (t) =>
      t.provider === STRIPE_REFUND_PROVIDER &&
      (t.metadata as { reference?: string } | null)?.reference === reference,
  );
  if (existing) return { kind: "already", refundId: existing.transactionId };

  /*
   * The charge to refund against. Newer rows carry the payment intent in their
   * metadata; older ones only have the Checkout Session id in `transactionId`,
   * which `createStripeRefund` resolves for us.
   */
  const charge = order.transactions.find(
    (t) => t.provider === "STRIPE" && t.status === PaymentStatus.PAID,
  );
  const chargeId =
    (charge?.metadata as { paymentIntentId?: string } | null)?.paymentIntentId ??
    charge?.transactionId ??
    null;

  if (!chargeId) {
    return {
      kind: "manual",
      reason: `No Stripe charge is recorded against ${order.orderNumber}. Refund it from the Stripe dashboard.`,
    };
  }

  const refund = await createStripeRefund(chargeId, amountAed, reference);

  await prisma.paymentTransaction.create({
    data: {
      orderId,
      provider: STRIPE_REFUND_PROVIDER,
      transactionId: refund.id,
      amountAed: toDecimal(refund.amountAed),
      status: PaymentStatus.REFUNDED,
      metadata: {
        reference,
        paymentIntentId: refund.paymentIntentId,
        stripeStatus: refund.status,
      },
    },
  });

  return {
    kind: "refunded",
    refundId: refund.id,
    paymentIntentId: refund.paymentIntentId,
    amountAed: refund.amountAed,
    stripeStatus: refund.status,
  };
}

/**
 * The customer-facing timeline on an order page.
 *
 * The five steps themselves live in `./timeline`, which carries no
 * `server-only` — the guest tracking page draws the same track from a client
 * component. Re-exported here so every server caller keeps one import.
 */
export { orderTimeline } from "@/modules/orders/timeline";
export type { TimelineOrder, TimelineStep } from "@/modules/orders/timeline";
