import "server-only";
import Stripe from "stripe";
import { PaymentMethod } from "@/generated/prisma/enums";
import { absoluteImg } from "@/lib/assets";
import { toFils } from "@/modules/shared/money";
import type {
  PaymentContext,
  PaymentIntentResult,
  PaymentProvider,
  WebhookResult,
} from "@/modules/payments/types";

/**
 * Stripe — cards and Apple Pay — through the official SDK and a hosted
 * Checkout Session.
 *
 * Apple Pay needs no separate integration: a Checkout Session offers it
 * automatically on a supporting device once the domain is verified in the
 * Stripe dashboard.
 */

function secretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key ? key : null;
}

function webhookSecret(): string | null {
  const key = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return key ? key : null;
}

/*
 * Built on first use rather than at import, so `next build` — which imports
 * this module with no keys in the environment — does not fail, and a key
 * changed in the environment is picked up by a fresh instance.
 */
let client: { key: string; stripe: Stripe } | null = null;

function stripe(): Stripe {
  const key = secretKey();
  if (!key) throw new Error("Stripe is not configured.");
  if (client?.key !== key) client = { key, stripe: new Stripe(key) };
  return client.stripe;
}

/**
 * Stripe fetches line-item images itself, so it needs a public https URL. A
 * relative path on a laptop (`http://localhost:3000/img/…`) is unreachable from
 * Stripe and gets the whole session refused, so it is left off instead.
 */
function stripeImage(image: string, origin: string): string[] {
  if (!image) return [];
  const url = absoluteImg(image, origin);
  return url.startsWith("https://") ? [url] : [];
}

export const stripeProvider: PaymentProvider = {
  method: PaymentMethod.STRIPE,
  label: "Card or Apple Pay",
  description: "Visa, Mastercard and Apple Pay, secured by Stripe.",

  isAvailable() {
    // Without the webhook secret nothing can ever mark a card order paid, so
    // taking the money would leave it PENDING — and its stock never released.
    return secretKey() !== null && webhookSecret() !== null;
  },

  async createIntent(context: PaymentContext): Promise<PaymentIntentResult> {
    /*
     * A line per garment, delivery as a shipping option and VAT as its own
     * line — each one the exact fils the order row already holds. The bag has
     * been priced and totalled by the checkout module in fils, so these add up
     * to `amountAed` to the fil; Stripe is shown the invoice, never asked to
     * work one out. The webhook checks the total again before marking paid.
     */
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      context.lines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: "aed",
          unit_amount: toFils(line.unitPriceAed),
          product_data: {
            name: `${line.productName} (${line.size})`,
            images: stripeImage(line.image, context.origin),
          },
        },
      }));

    if (context.vatAed > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "aed",
          unit_amount: toFils(context.vatAed),
          product_data: { name: "VAT (5%)" },
        },
      });
    }

    const cart = JSON.stringify(
      context.lines.map((line) => [line.variantId, line.quantity]),
    );

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name:
              context.shippingFeeAed > 0 ? "Standard delivery" : "Free standard delivery",
            fixed_amount: { amount: toFils(context.shippingFeeAed), currency: "aed" },
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 5 },
            },
          },
        },
      ],
      // The address and phone were collected and validated by our own form
      // and are already on the order, so Stripe is not asked for them again.
      customer_email: context.customerEmail,
      client_reference_id: context.orderNumber,
      metadata: {
        orderNumber: context.orderNumber,
        orderId: context.orderId,
        // [variantId, quantity] pairs, for reading in the Stripe dashboard.
        // Stripe caps a value at 500 characters; a large bag goes without,
        // since the order itself is the record of what was bought.
        ...(cart.length <= 500 ? { cart } : {}),
      },
      success_url: `${context.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${context.origin}/cart`,
      /*
       * The order's stock is held from the moment it is placed, so an
       * abandoned card sheet should give it back soon rather than after
       * Stripe's default 24 hours. `checkout.session.expired` releases it.
       * Thirty minutes is Stripe's minimum; the extra minute keeps a clock
       * running slightly behind Stripe's from having the session refused.
       */
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    });

    return {
      status: "PENDING",
      redirectUrl: session.url ?? null,
      transactionId: session.id,
      metadata: { sessionId: session.id },
      customerInstructions: [
        "Your card has not been charged until the payment completes.",
        "The order is held for you while you pay.",
      ],
    };
  },
};

/**
 * The order a Checkout Session belongs to, for the page Stripe sends the
 * customer back to. Read-only: what the customer sees there is the order as
 * the webhook has left it, never a status inferred from the session.
 */
export async function stripeSessionOrderNumber(
  sessionId: string,
): Promise<string | null> {
  if (!secretKey()) return null;
  const session = await stripe().checkout.sessions.retrieve(sessionId);
  return session.metadata?.orderNumber ?? session.client_reference_id ?? null;
}

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

export type StripeRefund = {
  /** `re_…` — what goes on the PaymentTransaction row as evidence. */
  id: string;
  /** Stripe's own word: `succeeded`, `pending`, `failed`, `canceled`. */
  status: string;
  amountAed: number;
  paymentIntentId: string;
};

/**
 * The payment intent behind an id we happen to be holding.
 *
 * A Checkout Session (`cs_…`) is what `createIntent` gets back and what older
 * webhook rows recorded, but a refund is issued against the payment intent
 * (`pi_…`) underneath it. Rather than make the caller know which kind of id it
 * has, this resolves one to the other — a single extra GET, only in the case
 * where it is actually needed.
 */
export async function resolveStripePaymentIntent(
  id: string,
): Promise<string | null> {
  const value = id.trim();
  if (value.startsWith("pi_")) return value;
  if (!value.startsWith("cs_")) return null;

  const session = await stripe().checkout.sessions.retrieve(value);
  const intent = session.payment_intent;
  return typeof intent === "string" ? intent : (intent?.id ?? null);
}

/**
 * Send money back.
 *
 * Called when an administrator marks a return refunded on a card order, so the
 * customer is not waiting on somebody remembering to press a button in the
 * Stripe dashboard. Partial refunds are the normal case — one piece out of
 * three coming back — so the amount is always sent explicitly rather than
 * letting Stripe assume the whole charge.
 *
 * `idempotencyKey` should be something stable about *this* refund, such as the
 * return number: a resolve form saved twice, or a retry after a timeout, then
 * gets the first refund back rather than making a second one.
 */
export async function createStripeRefund(
  paymentIntentId: string,
  amountAed: number,
  idempotencyKey?: string,
): Promise<StripeRefund> {
  const intent = await resolveStripePaymentIntent(paymentIntentId);
  if (!intent) {
    throw new Error(
      `${paymentIntentId} is not a Stripe payment we can refund against.`,
    );
  }

  const fils = toFils(amountAed);
  if (!Number.isFinite(fils) || fils <= 0) {
    throw new Error("A refund has to be for more than nothing.");
  }

  const refund = await stripe().refunds.create(
    { payment_intent: intent, amount: fils },
    idempotencyKey ? { idempotencyKey } : undefined,
  );

  return {
    id: refund.id,
    status: refund.status ?? "unknown",
    amountAed: refund.amount / 100,
    paymentIntentId: intent,
  };
}

/**
 * Verify a webhook and say what it means.
 *
 * The signature check is the security boundary of the whole payment flow:
 * without it, anyone who can reach the endpoint can mark any order paid.
 * `constructEvent` does the HMAC-SHA256 over `timestamp.payload` and enforces
 * Stripe's five-minute replay window.
 *
 * `payload` must be the **raw** request body. Parsing and re-stringifying the
 * JSON changes the bytes and the signature will never match.
 */
export function verifyStripeWebhook(
  payload: string,
  signatureHeader: string | null,
): WebhookResult {
  const secret = webhookSecret();
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set.");
  if (!signatureHeader) throw new Error("Missing Stripe-Signature header.");

  // The key is not used to verify, but the SDK client is what carries
  // `webhooks`; a placeholder keeps verification working without one.
  const event = (client?.stripe ?? new Stripe(secretKey() ?? "sk_unset")).webhooks
    .constructEvent(payload, signatureHeader, secret);

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded" &&
    event.type !== "checkout.session.async_payment_failed" &&
    event.type !== "checkout.session.expired"
  ) {
    return {
      orderNumber: "",
      outcome: "IGNORED",
      transactionId: null,
      amountAed: null,
      raw: { type: event.type },
    };
  }

  const session = event.data.object;

  /*
   * `completed` fires when the customer finishes the Checkout page, which for
   * a card is the moment of payment — but for a delayed method it is only the
   * promise of one, with `payment_status` still `unpaid`. Only `paid` is
   * money; the async events settle the rest. `expired` means the customer
   * never paid at all, and the order's stock should go back.
   */
  const outcome: WebhookResult["outcome"] =
    event.type === "checkout.session.expired"
      ? "EXPIRED"
      : event.type === "checkout.session.async_payment_failed"
      ? "FAILED"
      : session.payment_status === "paid"
        ? "PAID"
        : "IGNORED";

  /*
   * The session id is what the customer's receipt refers to and what makes a
   * replay recognisable; the payment intent is what `createStripeRefund` needs
   * months later. Both are kept.
   */
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  return {
    orderNumber:
      session.metadata?.orderNumber ?? session.client_reference_id ?? "",
    outcome,
    transactionId: session.id,
    paymentIntentId,
    amountAed: session.amount_total === null ? null : session.amount_total / 100,
    raw: {
      type: event.type,
      eventId: event.id,
      sessionId: session.id,
      ...(paymentIntentId ? { paymentIntentId } : {}),
      ...(session.customer_details?.email
        ? { customerEmail: session.customer_details.email }
        : {}),
    },
  };
}
