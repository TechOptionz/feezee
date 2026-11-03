import { PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { verifyStripeWebhook } from "@/modules/payments";
import { recordPayment, releaseExpiredOrder } from "@/modules/orders";

/**
 * Stripe's callback — the only thing on this site allowed to mark an order paid.
 *
 * Three things make it safe:
 *
 * 1. **The raw body is verified before it is trusted.** `request.text()` rather
 *    than `request.json()`, because the signature covers the exact bytes Stripe
 *    sent and re-serialising the JSON changes them.
 * 2. **It is idempotent.** Stripe retries until it gets a 2xx, and a network
 *    blip means the same event arrives twice. A session already recorded, or
 *    an order already in the status the event asks for, is acknowledged and
 *    ignored — and the status change itself is a conditional write, so two
 *    copies arriving at the same instant still record it once.
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
    /*
     * The reason goes to the log, never down the wire. This endpoint is public
     * and unauthenticated by nature, and the thrown messages are specific
     * enough to be worth something to someone probing it — "STRIPE_WEBHOOK_
     * SECRET is not set" says the deployment is misconfigured, and the
     * signature messages distinguish a bad HMAC from a stale timestamp. Stripe
     * itself only needs to know it was refused.
     */
    console.warn(
      "[stripe] rejected webhook:",
      error instanceof Error ? error.message : error,
    );
    return new Response("Invalid signature.", { status: 400 });
  }

  if (event.outcome === "IGNORED" || !event.orderNumber) {
    console.info(`[stripe] ignored ${event.raw.type}`);
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

  /*
   * An abandoned card sheet. The order was written and its stock taken before
   * the customer reached Stripe, so expiry gives the stock back. Anything no
   * longer PENDING — paid, or already released by an earlier copy of this
   * event — is left alone; `releaseExpiredOrder` checks that in its write.
   */
  if (event.outcome === "EXPIRED") {
    const released = await releaseExpiredOrder(order.id, {
      transactionId: event.transactionId,
      metadata: event.raw,
    });
    return Response.json({
      received: true,
      handled: released !== null,
      ...(released ? {} : { reason: "not pending" }),
    });
  }

  const status =
    event.outcome === "PAID"
      ? PaymentStatus.PAID
      : event.outcome === "REFUNDED"
        ? PaymentStatus.REFUNDED
        : PaymentStatus.FAILED;

  const alreadyRecorded =
    event.transactionId !== null &&
    (await prisma.paymentTransaction.findFirst({
      where: { orderId: order.id, transactionId: event.transactionId, status },
      select: { id: true },
    })) !== null;

  if (alreadyRecorded || order.paymentStatus === status) {
    return Response.json({ received: true, handled: false, reason: "duplicate" });
  }

  /*
   * The session was built from this order's own figures, so a paid amount
   * short of the total means something is wrong — a session edited in the
   * dashboard, or one that was never ours. Acknowledged, so Stripe stops, but
   * left for a person to look at rather than marked paid.
   */
  const totalFils = Math.round(Number(order.totalAed) * 100);
  if (
    status === PaymentStatus.PAID &&
    (event.amountAed === null || Math.round(event.amountAed * 100) < totalFils)
  ) {
    console.error(
      `[stripe] ${event.transactionId} paid ${event.amountAed} AED against ${event.orderNumber} totalling ${order.totalAed} — not marking paid`,
    );
    return Response.json({ received: true, handled: false, reason: "amount" });
  }

  const recorded = await recordPayment(
    order.id,
    {
      provider: "STRIPE",
      transactionId: event.transactionId,
      amountAed: event.amountAed ?? Number(order.totalAed),
      status,
      metadata: event.raw,
    },
    { onlyIfChanged: true },
  );

  return Response.json({ received: true, handled: recorded !== null });
}
