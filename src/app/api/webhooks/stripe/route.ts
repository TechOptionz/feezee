import { PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { verifyStripeWebhook } from "@/modules/payments";
import { recordPayment } from "@/modules/orders";

/**
 * Stripe's callback — the only thing on this site allowed to mark an order paid.
 *
 * Three things make it safe:
 *
 * 1. **The raw body is verified before it is trusted.** `request.text()` rather
 *    than `request.json()`, because the signature covers the exact bytes Stripe
 *    sent and re-serialising the JSON changes them.
 * 2. **It is idempotent.** Stripe retries until it gets a 2xx, and a network
 *    blip means the same event arrives twice. An order already marked PAID is
 *    acknowledged and ignored rather than written again.
 * 3. **A rejected signature is a 400, not a 500.** A 5xx makes Stripe retry
 *    forever; a forged request should be told no once.
 */
export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = verifyStripeWebhook(payload, signature);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    console.warn("[stripe] rejected webhook:", message);
    return new Response(message, { status: 400 });
  }

  if (event.outcome === "IGNORED" || !event.orderNumber) {
    return Response.json({ received: true, handled: false });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: event.orderNumber },
    select: { id: true, paymentStatus: true, totalAed: true },
  });

  if (!order) {
    // Acknowledged: an order we do not have is not something Stripe can fix by
    // retrying, and a 4xx here would have it try for days.
    console.warn(`[stripe] no order ${event.orderNumber}`);
    return Response.json({ received: true, handled: false });
  }

  const status =
    event.outcome === "PAID"
      ? PaymentStatus.PAID
      : event.outcome === "REFUNDED"
        ? PaymentStatus.REFUNDED
        : PaymentStatus.FAILED;

  if (order.paymentStatus === status) {
    return Response.json({ received: true, handled: false, reason: "duplicate" });
  }

  await recordPayment(order.id, {
    provider: "STRIPE",
    transactionId: event.transactionId,
    amountAed: event.amountAed ?? Number(order.totalAed),
    status,
    metadata: event.raw,
  });

  return Response.json({ received: true, handled: true });
}
