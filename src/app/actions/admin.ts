"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  FulfillmentStatus,
  PaymentStatus,
  ReturnStatus,
  StockReason,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { audit, requireStaffAction, ForbiddenError } from "@/modules/admin";
import { setStock } from "@/modules/inventory";
import {
  CheckoutError,
  updateFulfillment,
  orderById,
  refundStripePayment,
} from "@/modules/orders";
import { resolveReturn, ReturnError, returnById } from "@/modules/returns";
import { AuthError, login, logout } from "@/modules/customers";
import { loginSchema } from "@/modules/customers";
import { toDecimal } from "@/modules/shared/money";
import {
  orderDispatchedEmail,
  returnUpdateEmail,
  sendEmailInBackground,
} from "@/modules/notifications";
import { trackingUrlFor } from "@/modules/shipping";
import { formatPrice } from "@/lib/currency";

/**
 * Everything the shop's own staff can do.
 *
 * Two rules, applied without exception:
 *
 * 1. **Every action re-checks the session.** A server action is a public HTTP
 *    endpoint — the fact that only the admin UI links to it protects nothing.
 * 2. **Everything that changes something writes an audit row**, with the state
 *    before and after. When an order is refunded twice or a price drops by a
 *    factor of ten, the question is always who and when.
 */

export type AdminFormState = {
  status: "idle" | "error" | "ok";
  message?: string;
  fieldErrors?: Record<string, string>;
};

function fail(error: unknown): AdminFormState {
  if (
    error instanceof CheckoutError ||
    error instanceof ReturnError ||
    error instanceof ForbiddenError ||
    error instanceof AuthError
  ) {
    return { status: "error", message: error.message };
  }
  console.error("[admin]", error);
  return { status: "error", message: "Something went wrong. Please try again." };
}

/**
 * Push a stock change out to the shop.
 *
 * Product pages are ISR with a 60-second window, which is right for a price
 * that drifts but wrong for stock: a size restocked on the shop floor should be
 * buyable now, and a size that has just gone should stop being offered now.
 * Everything that moves stock calls this with the variants it touched, and the
 * garment's own page is rebuilt on the next request.
 *
 * Takes variant ids rather than slugs because that is what the callers have —
 * an order line knows its variant, not its URL. Ids that no longer resolve
 * (a garment deleted from the catalogue) simply match nothing.
 */
async function revalidateStorefrontFor(variantIds: (string | null)[]) {
  const ids = [...new Set(variantIds.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return;

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: ids } },
    select: { product: { select: { slug: true } } },
  });

  for (const slug of new Set(variants.map((v) => v.product.slug))) {
    revalidatePath(`/product/${slug}`);
  }
}

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

export async function adminLoginAction(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Enter your email and password." };
  }

  try {
    // "staff" makes a customer account fail exactly like a wrong password, so
    // this form never confirms that an address exists on the customer side.
    await login(parsed.data, "staff");
  } catch (error) {
    return fail(error);
  }

  const next = String(formData.get("next") ?? "/admin");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function adminLogoutAction() {
  await logout();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export async function adjustStockAction(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  let actor;
  try {
    actor = await requireStaffAction();
  } catch (error) {
    return fail(error);
  }

  const variantId = String(formData.get("variantId") ?? "");
  const newStock = Number(formData.get("stock"));
  const reason = String(formData.get("reason") ?? "MANUAL_AUDIT") as StockReason;
  const note = String(formData.get("note") ?? "").trim();

  if (!Number.isInteger(newStock) || newStock < 0) {
    return { status: "error", fieldErrors: { stock: "Enter a whole number, 0 or more." } };
  }
  if (!Object.values(StockReason).includes(reason)) {
    return { status: "error", fieldErrors: { reason: "Choose a reason." } };
  }

  try {
    const result = await setStock(variantId, newStock, reason, {
      note: note || undefined,
      userId: actor.id,
    });

    await audit({
      actor,
      action: "inventory.adjust",
      entityType: "ProductVariant",
      entityId: variantId,
      previousState: { stock: result.previous },
      newState: { stock: result.current, delta: result.delta, reason, note },
    });

    await revalidateStorefrontFor([variantId]);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin");
    return {
      status: "ok",
      message:
        result.delta === 0
          ? "No change — the count already matched."
          : `Stock ${result.delta > 0 ? "up" : "down"} ${Math.abs(result.delta)} to ${result.current}.`,
    };
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function updateOrderStatusAction(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  let actor;
  try {
    actor = await requireStaffAction();
  } catch (error) {
    return fail(error);
  }

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "") as FulfillmentStatus;
  const courierName = String(formData.get("courierName") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();

  if (!Object.values(FulfillmentStatus).includes(status)) {
    return { status: "error", message: "That is not a status an order can take." };
  }

  try {
    const before = await orderById(orderId);
    const order = await updateFulfillment(
      orderId,
      { status, courierName: courierName || null, trackingNumber: trackingNumber || null },
      actor.id,
    );

    await audit({
      actor,
      action: `order.${status.toLowerCase()}`,
      entityType: "Order",
      entityId: order.orderNumber,
      previousState: { fulfillmentStatus: before?.fulfillmentStatus },
      newState: { fulfillmentStatus: status, courierName, trackingNumber },
    });

    if (status === "DISPATCHED") {
      sendEmailInBackground({
        to: order.customerEmail,
        ...orderDispatchedEmail({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          courierName,
          trackingNumber,
          trackingUrl: trackingUrlFor(courierName, trackingNumber),
        }),
      });
    }

    // Cancelling restocks every line, so those garments are buyable again.
    if (status === "CANCELLED") {
      await revalidateStorefrontFor(order.items.map((item) => item.variantId));
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { status: "ok", message: `Order marked ${status.toLowerCase()}.` };
  } catch (error) {
    return fail(error);
  }
}

export async function updatePaymentStatusAction(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  let actor;
  try {
    actor = await requireStaffAction();
  } catch (error) {
    return fail(error);
  }

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("paymentStatus") ?? "") as PaymentStatus;

  if (!Object.values(PaymentStatus).includes(status)) {
    return { status: "error", message: "That is not a payment status." };
  }

  try {
    const before = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { paymentStatus: true, orderNumber: true, totalAed: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: status,
          ...(status === PaymentStatus.PAID ? { paidAt: new Date() } : {}),
        },
      });
      await tx.paymentTransaction.create({
        data: {
          orderId,
          provider: "MANUAL",
          transactionId: null,
          amountAed: before.totalAed,
          status,
          metadata: { markedBy: actor.email },
        },
      });
    });

    await audit({
      actor,
      action: "order.payment",
      entityType: "Order",
      entityId: before.orderNumber,
      previousState: { paymentStatus: before.paymentStatus },
      newState: { paymentStatus: status },
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { status: "ok", message: `Payment marked ${status.toLowerCase()}.` };
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Returns
// ---------------------------------------------------------------------------

export async function resolveReturnAction(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  let actor;
  try {
    actor = await requireStaffAction();
  } catch (error) {
    return fail(error);
  }

  const returnId = String(formData.get("returnId") ?? "");
  const status = String(formData.get("status") ?? "") as ReturnStatus;
  const refundRaw = String(formData.get("refundAmountAed") ?? "").trim();
  const restock = formData.get("restock") === "on";

  if (!Object.values(ReturnStatus).includes(status)) {
    return { status: "error", message: "That is not a return status." };
  }

  const refundAmountAed = refundRaw === "" ? undefined : Number(refundRaw);
  if (refundAmountAed !== undefined && !Number.isFinite(refundAmountAed)) {
    return { status: "error", fieldErrors: { refundAmountAed: "Enter an amount in AED." } };
  }

  try {
    const before = await returnById(returnId);
    if (!before) {
      return { status: "error", message: "That return no longer exists." };
    }

    /*
     * The money moves before the record says it has.
     *
     * Stripe is called first and the return is only marked refunded once it
     * has answered. The other order would leave a return closed as REFUNDED —
     * and REFUNDED has no next status, so the form could not be saved again —
     * with the customer still waiting for money that was never sent. If Stripe
     * refuses, nothing here changes and the admin sees why.
     */
    const amountToRefund =
      refundAmountAed ?? before.refundAmountAed ?? before.suggestedRefundAed;

    let refund: Awaited<ReturnType<typeof refundStripePayment>> | null = null;
    if (
      status === ReturnStatus.REFUNDED &&
      before.status !== ReturnStatus.REFUNDED
    ) {
      try {
        refund = await refundStripePayment(
          before.orderId,
          amountToRefund,
          before.returnNumber,
        );
      } catch (error) {
        // Stripe's own words, not a generic apology: "amount exceeds the
        // charge" or "this payment has already been refunded" is exactly what
        // the admin needs in order to decide what to do next.
        console.error("[admin] stripe refund", error);
        return {
          status: "error",
          message: `Stripe refused the refund, so nothing has changed: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        };
      }
    }

    const updated = await resolveReturn(
      returnId,
      {
        status,
        adminNotes: String(formData.get("adminNotes") ?? "").trim() || undefined,
        // Whatever Stripe actually sent back is what the return records.
        refundAmountAed:
          refund?.kind === "refunded" ? refund.amountAed : refundAmountAed,
        restock,
      },
      actor.id,
    );

    await audit({
      actor,
      action: `return.${status.toLowerCase()}`,
      entityType: "ReturnRequest",
      entityId: updated.returnNumber,
      previousState: {
        status: before.status,
        isRestocked: before.isRestocked,
      },
      newState: {
        status: updated.status,
        isRestocked: updated.isRestocked,
        refundAmountAed: updated.refundAmountAed,
        ...(refund?.kind === "refunded"
          ? {
              stripeRefundId: refund.refundId,
              stripePaymentIntentId: refund.paymentIntentId,
              stripeRefundStatus: refund.stripeStatus,
            }
          : {}),
        ...(refund?.kind === "manual" ? { payoutByHand: refund.reason } : {}),
      },
    });

    sendEmailInBackground({
      to: updated.customerEmail,
      ...returnUpdateEmail({
        returnNumber: updated.returnNumber,
        orderNumber: updated.orderNumber,
        customerName: updated.customerName,
        status: updated.status,
        refundAmountAed: updated.refundAmountAed,
        adminNotes: updated.adminNotes,
      }),
    });

    // Only when this save is what actually put them back on the rail.
    if (updated.isRestocked && !before.isRestocked) {
      await revalidateStorefrontFor(updated.items.map((item) => item.variantId));
    }

    revalidatePath(`/admin/orders/${before.orderId}`);
    revalidatePath("/admin/returns");
    revalidatePath("/admin");

    // The refund is the half of this the admin cannot see from the list, so it
    // is said out loud — including when it is still theirs to do by hand.
    const note =
      refund?.kind === "refunded"
        ? ` ${formatPrice(refund.amountAed)} sent back through Stripe (${refund.refundId}).`
        : refund?.kind === "already"
          ? " That refund had already been sent — nothing was charged back twice."
          : refund?.kind === "manual"
            ? ` ${refund.reason}`
            : "";

    return {
      status: "ok",
      message: `Return marked ${status.toLowerCase()}.${note}`,
    };
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

const LINE_CODE: Record<string, string> = {
  "Printed Lawn": "PL",
  "Luxury Pret": "LP",
  "Ready to Wear": "RW",
  Sale: "SL",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function saveProductAction(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  let actor;
  try {
    actor = await requireStaffAction();
  } catch (error) {
    return fail(error);
  }

  const id = Number(formData.get("productId")) || null;
  const name = String(formData.get("name") ?? "").trim();
  const collection = String(formData.get("collection") ?? "").trim();
  const aed = Number(formData.get("aed"));
  const wasRaw = String(formData.get("wasAed") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Give the piece a name.";
  if (!Number.isFinite(aed) || aed <= 0) fieldErrors.aed = "Enter a price in AED.";
  if (wasRaw && !Number.isFinite(Number(wasRaw))) {
    fieldErrors.wasAed = "Enter an amount, or leave it blank.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors };
  }

  const images = String(formData.get("images") ?? "")
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean);

  const data = {
    name,
    slug: slugify(name),
    fabric: String(formData.get("fabric") ?? "").trim(),
    fabricFamily: String(formData.get("fabricFamily") ?? "").trim(),
    type: String(formData.get("type") ?? "Kurtas").trim(),
    pieces: Number(formData.get("pieces")) || 1,
    withDupatta: formData.get("withDupatta") === "on",
    collection,
    aed: toDecimal(aed),
    wasAed: wasRaw ? toDecimal(Number(wasRaw)) : null,
    badgeLabel: String(formData.get("badgeLabel") ?? "").trim() || null,
    badgeTone: String(formData.get("badgeTone") ?? "").trim() || null,
    cut: String(formData.get("cut") ?? "").trim(),
    colour: String(formData.get("colour") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    careInstructions: String(formData.get("careInstructions") ?? "").trim(),
    isArchived: formData.get("isArchived") === "on",
  };

  try {
    const product = await prisma.$transaction(async (tx) => {
      const row = id
        ? await tx.product.update({ where: { id }, data })
        : await tx.product.create({ data });

      await tx.productImage.deleteMany({ where: { productId: row.id } });
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((url, i) => ({
            productId: row.id,
            url,
            alt: i === 0 ? row.name : `${row.name} — view ${i + 1}`,
            sortOrder: i,
            isFeatured: i === 0,
          })),
        });
      }

      /*
       * A new product gets its six sizes at zero. Nothing is ever put on the
       * rail by saving a form — stock arrives through the inventory screen,
       * where it is counted and written to the ledger with a reason.
       */
      if (!id) {
        const code = LINE_CODE[collection] ?? "FZ";
        for (const size of SIZES) {
          await tx.productVariant.create({
            data: {
              productId: row.id,
              size,
              colour: data.colour,
              sku: `FZ-${code}-${String(row.id).padStart(3, "0")}-${size}`,
              stock: 0,
            },
          });
        }
      }

      return row;
    });

    await audit({
      actor,
      action: id ? "product.update" : "product.create",
      entityType: "Product",
      entityId: String(product.id),
      newState: { name: product.name, collection, aed, isArchived: data.isArchived },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/product/${product.slug}`);
    revalidatePath("/");
  } catch (error) {
    return fail(error);
  }

  redirect("/admin/products");
}

export async function toggleArchiveAction(formData: FormData) {
  const actor = await requireStaffAction();
  const id = Number(formData.get("productId"));

  const before = await prisma.product.findUniqueOrThrow({
    where: { id },
    select: { isArchived: true, name: true, slug: true },
  });

  await prisma.product.update({
    where: { id },
    data: { isArchived: !before.isArchived },
  });

  await audit({
    actor,
    action: before.isArchived ? "product.restore" : "product.archive",
    entityType: "Product",
    entityId: String(id),
    previousState: { isArchived: before.isArchived },
    newState: { isArchived: !before.isArchived },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/product/${before.slug}`);
  revalidatePath("/");
}
