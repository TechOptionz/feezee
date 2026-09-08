"use server";

import { PaymentMethod } from "@/generated/prisma/enums";
import { checkoutSchema } from "@/modules/checkout";
import { OutOfStockError } from "@/modules/inventory";
import { CheckoutError, placeOrder, recordPayment, type BasketLine } from "@/modules/orders";
import { createPaymentIntent } from "@/modules/payments";
import { getSession } from "@/modules/customers/session";
import { saveAddress, addressSchema } from "@/modules/customers";
import {
  orderConfirmationEmail,
  sendEmailInBackground,
} from "@/modules/notifications";
import { site } from "@/lib/site";
import { prisma } from "@/lib/prisma";

/**
 * Placing the order — the one action on the site that moves stock and money.
 *
 * Everything it is given is treated as hostile: the basket is re-priced from
 * the database, the address is re-validated with the same schema the form used,
 * and the customer id comes from the session cookie rather than from the form.
 * The only thing the browser gets to decide is which garments and how many.
 */

export type CheckoutState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | {
      status: "placed";
      orderNumber: string;
      /** Set when the provider needs the customer to go and pay. */
      redirectUrl: string | null;
    };

export async function submitCheckout(
  lines: BasketLine[],
  form: Record<string, unknown>,
): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse(form);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return {
      status: "error",
      message: "Please check the details below.",
      fieldErrors,
    };
  }

  const details = parsed.data;
  const session = await getSession();
  const userId = session?.userId ?? null;

  const safeLines = lines
    .filter((line) => typeof line.variantId === "string" && line.variantId)
    .map((line) => ({
      variantId: line.variantId,
      quantity: Math.max(1, Math.min(Math.floor(line.quantity) || 1, 20)),
    }));

  if (safeLines.length === 0) {
    return { status: "error", message: "Your bag is empty." };
  }

  let placed;
  try {
    placed = await placeOrder({ lines: safeLines, details, userId });
  } catch (error) {
    if (error instanceof OutOfStockError || error instanceof CheckoutError) {
      return { status: "error", message: error.message };
    }
    console.error("[checkout] failed to place order", error);
    return {
      status: "error",
      message:
        "Something went wrong placing your order. Nothing has been charged — please try again.",
    };
  }

  /*
   * From here the order exists and the stock is held. Anything that fails below
   * is recoverable by hand from the admin, so none of it is allowed to throw
   * the customer back to an error page on an order that was actually placed.
   */

  let redirectUrl: string | null = null;
  try {
    const intent = await createPaymentIntent(details.paymentMethod, {
      orderId: placed.id,
      orderNumber: placed.orderNumber,
      amountAed: placed.totals.totalAed,
      customerEmail: placed.customerEmail,
      customerName: details.fullName,
      origin: site.url,
    });

    redirectUrl = intent.redirectUrl;

    await recordPayment(placed.id, {
      provider: details.paymentMethod,
      transactionId: intent.transactionId,
      amountAed: placed.totals.totalAed,
      // COD and bank transfer are both PENDING until someone confirms the
      // money arrived; Stripe stays PENDING until its webhook says otherwise.
      status: "PENDING",
      metadata: { instructions: intent.customerInstructions },
    });
  } catch (error) {
    console.error("[checkout] payment intent failed", error);
    // The order stands. The confirmation page will show it as awaiting payment.
  }

  if (details.saveAddress && userId) {
    try {
      const address = addressSchema.parse({
        fullName: details.fullName,
        phone: details.phone,
        emirate: details.emirate,
        city: details.city,
        addressLine1: details.addressLine1,
        addressLine2: details.addressLine2,
        landmark: details.landmark,
      });
      await saveAddress(userId, address);
    } catch {
      /* An address book that did not save is not worth failing an order for. */
    }
  }

  await sendConfirmation(placed.orderNumber);

  return { status: "placed", orderNumber: placed.orderNumber, redirectUrl };
}

/** The receipt. Fired and forgotten so the customer is not kept waiting on it. */
async function sendConfirmation(orderNumber: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true, transactions: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!order) return;

    const metadata = order.transactions[0]?.metadata as
      | { instructions?: string[] }
      | null;

    sendEmailInBackground({
      to: order.customerEmail,
      ...orderConfirmationEmail({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        placedAt: order.placedAt.toISOString(),
        items: order.items.map((item) => ({
          productName: item.productName,
          variantSize: item.variantSize,
          quantity: item.quantity,
          unitPriceAed: Number(item.unitPriceAed),
          totalAed: Number(item.totalAed),
        })),
        subtotalAed: Number(order.subtotalAed),
        shippingFeeAed: Number(order.shippingFeeAed),
        vatAed: Number(order.vatAed),
        totalAed: Number(order.totalAed),
        paymentMethod: order.paymentMethod,
        shippingAddressLine: order.shippingAddressLine,
        shippingCity: order.shippingCity,
        shippingEmirate: order.shippingEmirate,
        customerPhone: order.customerPhone,
        instructions: metadata?.instructions ?? [],
      }),
    });
  } catch (error) {
    console.error("[checkout] confirmation email failed", error);
  }
}

/** The payment methods the shop can currently offer, for the form. */
export async function paymentMethodsAvailable(): Promise<PaymentMethod[]> {
  const { availablePaymentOptions } = await import("@/modules/payments");
  return availablePaymentOptions().map((option) => option.method);
}
