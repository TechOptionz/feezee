import "server-only";
import { Prisma, ReturnStatus, PaymentStatus, StockReason } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toAed, toDecimal } from "@/modules/shared/money";
import { getSettings } from "@/modules/shared/settings";
import { restock } from "@/modules/inventory";

/**
 * Returns: what a customer may send back, and what happens when it arrives.
 *
 * The refund and the restock are deliberately two separate decisions. A piece
 * that comes back marked, or that was never really faulty, is still refunded as
 * a matter of goodwill — but it does not go back on the rail. Tying the two
 * together would either put damaged stock up for sale or refuse a refund to
 * protect the inventory count, and both are worse than an admin ticking a box.
 */

export class ReturnError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReturnError";
  }
}

/** `RET-FZ-26-1001-1` — the order it came from, and which return it is. */
async function nextReturnNumber(
  tx: Prisma.TransactionClient,
  orderNumber: string,
): Promise<string> {
  const existing = await tx.returnRequest.count({
    where: { order: { orderNumber } },
  });
  return `RET-${orderNumber}-${existing + 1}`;
}

export type Eligibility =
  | { eligible: true; deadline: string; daysLeft: number }
  | { eligible: false; reason: string };

/**
 * Whether an order can still be returned.
 *
 * Delivered, inside the window, and not already returned. The window runs from
 * the delivery date, not the order date — a parcel that took a week to arrive
 * has not eaten a week of the customer's seven days.
 */
export async function checkEligibility(orderId: string): Promise<Eligibility> {
  const settings = await getSettings();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { returns: true },
  });

  if (!order) return { eligible: false, reason: "That order does not exist." };

  if (order.fulfillmentStatus !== "DELIVERED" || !order.deliveredAt) {
    return {
      eligible: false,
      reason: "A return can be requested once the order has been delivered.",
    };
  }

  const open = order.returns.find(
    (r) => r.status !== ReturnStatus.REJECTED && r.status !== ReturnStatus.REFUNDED,
  );
  if (open) {
    return {
      eligible: false,
      reason: `Return ${open.returnNumber} is already open on this order.`,
    };
  }

  const deadline = new Date(order.deliveredAt);
  deadline.setDate(deadline.getDate() + settings.returnWindowDays);

  const msLeft = deadline.getTime() - Date.now();
  if (msLeft <= 0) {
    return {
      eligible: false,
      reason: `The ${settings.returnWindowDays}-day return window closed on ${deadline.toLocaleDateString("en-GB")}.`,
    };
  }

  return {
    eligible: true,
    deadline: deadline.toISOString(),
    daysLeft: Math.ceil(msLeft / (1000 * 60 * 60 * 24)),
  };
}

export type ReturnRequestInput = {
  orderId: string;
  reason: string;
  customerNotes?: string;
  items: { orderItemId: string; quantity: number; reason?: string }[];
};

/** Open a return. Refuses anything outside the policy, or more than was bought. */
export async function requestReturn(
  input: ReturnRequestInput,
  userId?: string | null,
) {
  const eligibility = await checkEligibility(input.orderId);
  if (!eligibility.eligible) throw new ReturnError(eligibility.reason);
  if (input.items.length === 0) {
    throw new ReturnError("Choose at least one piece to return.");
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: input.orderId },
      include: { items: true },
    });

    if (userId && order.userId && order.userId !== userId) {
      throw new ReturnError("That order is not yours.");
    }

    const byId = new Map(order.items.map((i) => [i.id, i]));
    for (const line of input.items) {
      const item = byId.get(line.orderItemId);
      if (!item) throw new ReturnError("That piece is not on this order.");
      if (line.quantity < 1 || line.quantity > item.quantity) {
        throw new ReturnError(
          `You can return between 1 and ${item.quantity} of ${item.productName}.`,
        );
      }
    }

    return tx.returnRequest.create({
      data: {
        orderId: order.id,
        returnNumber: await nextReturnNumber(tx, order.orderNumber),
        status: ReturnStatus.PENDING,
        reason: input.reason,
        customerNotes: input.customerNotes || null,
        items: {
          create: input.items.map((line) => ({
            orderItemId: line.orderItemId,
            quantity: line.quantity,
            reason: line.reason || null,
          })),
        },
      },
      include: { items: true },
    });
  });
}

const returnInclude = {
  order: {
    select: {
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      totalAed: true,
      paymentMethod: true,
    },
  },
  items: { include: { orderItem: true } },
} as const;

export type ReturnView = ReturnType<typeof toReturnView>;

function toReturnView(
  row: Prisma.ReturnRequestGetPayload<{ include: typeof returnInclude }>,
) {
  return {
    id: row.id,
    returnNumber: row.returnNumber,
    orderId: row.orderId,
    orderNumber: row.order.orderNumber,
    customerName: row.order.customerName,
    customerEmail: row.order.customerEmail,
    orderTotalAed: toAed(row.order.totalAed),
    /** Whether approving a refund can call Stripe, or needs a payout by hand. */
    paymentMethod: row.order.paymentMethod,
    status: row.status,
    reason: row.reason,
    customerNotes: row.customerNotes,
    adminNotes: row.adminNotes,
    refundAmountAed: row.refundAmountAed ? toAed(row.refundAmountAed) : null,
    isRestocked: row.isRestocked,
    requestedAt: row.requestedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    items: row.items.map((item) => ({
      id: item.id,
      orderItemId: item.orderItemId,
      /** Null once a garment has left the catalogue — see OrderItem.variantId. */
      variantId: item.orderItem.variantId,
      productName: item.orderItem.productName,
      size: item.orderItem.variantSize,
      image: item.orderItem.image,
      unitPriceAed: toAed(item.orderItem.unitPriceAed),
      quantity: item.quantity,
      reason: item.reason,
      condition: item.condition,
    })),
    /** What a full refund of the returned pieces would come to. */
    suggestedRefundAed: row.items.reduce(
      (sum, item) => sum + toAed(item.orderItem.unitPriceAed) * item.quantity,
      0,
    ),
  };
}

export async function returnById(id: string) {
  const row = await prisma.returnRequest.findUnique({
    where: { id },
    include: returnInclude,
  });
  return row ? toReturnView(row) : null;
}

export async function listReturns(status?: ReturnStatus) {
  const rows = await prisma.returnRequest.findMany({
    where: status ? { status } : {},
    include: returnInclude,
    orderBy: { requestedAt: "desc" },
  });
  return rows.map(toReturnView);
}

export async function returnsForUser(userId: string) {
  const rows = await prisma.returnRequest.findMany({
    where: { order: { userId } },
    include: returnInclude,
    orderBy: { requestedAt: "desc" },
  });
  return rows.map(toReturnView);
}

/** Returns waiting on someone — the dashboard's "active returns" count. */
export async function openReturnCount(): Promise<number> {
  return prisma.returnRequest.count({
    where: { status: { in: [ReturnStatus.PENDING, ReturnStatus.APPROVED, ReturnStatus.RECEIVED] } },
  });
}

export type ResolveInput = {
  status: ReturnStatus;
  adminNotes?: string;
  refundAmountAed?: number;
  /** Whether the pieces go back on the rail. Only acted on once. */
  restock?: boolean;
};

/**
 * Move a return along.
 *
 * The restock happens inside the same transaction as the status change, and
 * only when `isRestocked` is still false — so an admin who saves the form twice
 * cannot put the same garment back on the rail twice.
 */
export async function resolveReturn(
  returnId: string,
  input: ResolveInput,
  actorId?: string | null,
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.returnRequest.findUniqueOrThrow({
      where: { id: returnId },
      include: { items: { include: { orderItem: true } }, order: true },
    });

    const shouldRestock = Boolean(input.restock) && !current.isRestocked;

    if (shouldRestock) {
      for (const item of current.items) {
        const variantId = item.orderItem.variantId;
        if (!variantId) continue;
        await restock(tx, variantId, item.quantity, StockReason.RETURN_RESTOCK, {
          note: `Return ${current.returnNumber}`,
          userId: actorId ?? null,
        });
      }
    }

    const resolved =
      input.status === ReturnStatus.REFUNDED || input.status === ReturnStatus.REJECTED;

    await tx.returnRequest.update({
      where: { id: returnId },
      data: {
        status: input.status,
        adminNotes: input.adminNotes ?? current.adminNotes,
        refundAmountAed:
          input.refundAmountAed !== undefined
            ? toDecimal(input.refundAmountAed)
            : current.refundAmountAed,
        isRestocked: current.isRestocked || shouldRestock,
        resolvedAt: resolved ? new Date() : current.resolvedAt,
      },
    });

    // A refunded return is a refunded order — the payment status has to say so,
    // or the revenue report keeps counting money that has gone back.
    if (input.status === ReturnStatus.REFUNDED) {
      await tx.order.update({
        where: { id: current.orderId },
        data: { paymentStatus: PaymentStatus.REFUNDED },
      });
    }

    return toReturnView(
      await tx.returnRequest.findUniqueOrThrow({
        where: { id: returnId },
        include: returnInclude,
      }),
    );
  });
}
