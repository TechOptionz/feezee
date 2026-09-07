import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { PaymentMethod } from "@prisma/client";
import { toFils } from "@/modules/shared/money";
import type {
  PaymentContext,
  PaymentIntentResult,
  PaymentProvider,
  WebhookResult,
} from "@/modules/payments/types";

/**
 * Stripe — cards and Apple Pay — over the REST API.
 *
 * Deliberately no SDK. Two calls and one signature check is not worth a
 * dependency that pulls its own HTTP stack into the server bundle, and doing it
 * by hand keeps what is actually on the wire visible. Swapping in the official
 * `stripe` package later means replacing this file and nothing else.
 *
 * Apple Pay needs no separate integration: a Checkout Session offers it
 * automatically on a supporting device once the domain is verified in the
 * Stripe dashboard.
 */

const API = "https://api.stripe.com/v1";

function secretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key ? key : null;
}

function webhookSecret(): string | null {
  const key = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return key ? key : null;
}

/** Stripe takes `application/x-www-form-urlencoded`, including for nesting. */
function form(params: Record<string, string | number | undefined>): string {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) body.set(key, String(value));
  }
  return body.toString();
}

async function stripeFetch(
  path: string,
  body: string,
  key: string,
): Promise<Record<string, unknown>> {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const error = json.error as { message?: string } | undefined;
    throw new Error(error?.message ?? `Stripe returned ${response.status}.`);
  }
  return json;
}

export const stripeProvider: PaymentProvider = {
  method: PaymentMethod.STRIPE,
  label: "Card or Apple Pay",
  description: "Visa, Mastercard and Apple Pay, secured by Stripe.",

  isAvailable() {
    return secretKey() !== null;
  },

  async createIntent(context: PaymentContext): Promise<PaymentIntentResult> {
    const key = secretKey();
    if (!key) throw new Error("Stripe is not configured.");

    /*
     * One line for the whole order rather than a line per garment. The bag has
     * already been priced, VAT'd and totalled by the checkout module; sending
     * the pieces separately would ask Stripe to re-derive a total it has no
     * business deriving, and any disagreement between the two would be a
     * customer charged an amount the invoice does not show.
     */
    const session = await stripeFetch(
      "/checkout/sessions",
      form({
        mode: "payment",
        "payment_method_types[0]": "card",
        "line_items[0][quantity]": 1,
        "line_items[0][price_data][currency]": "aed",
        "line_items[0][price_data][unit_amount]": toFils(context.amountAed),
        "line_items[0][price_data][product_data][name]": `FEEZEE order ${context.orderNumber}`,
        customer_email: context.customerEmail,
        client_reference_id: context.orderNumber,
        "metadata[orderNumber]": context.orderNumber,
        "metadata[orderId]": context.orderId,
        success_url: `${context.origin}/order-confirmation/${context.orderNumber}?paid=1`,
        cancel_url: `${context.origin}/checkout?cancelled=${context.orderNumber}`,
      }),
      key,
    );

    return {
      status: "PENDING",
      redirectUrl: (session.url as string) ?? null,
      transactionId: (session.id as string) ?? null,
      metadata: { sessionId: session.id },
      customerInstructions: [
        "Your card has not been charged until the payment completes.",
        "The order is held for you while you pay.",
      ],
    };
  },
};

/**
 * Verify a webhook and say what it means.
 *
 * The signature check is the security boundary of the whole payment flow:
 * without it, anyone who can reach the endpoint can mark any order paid. It is
 * a timing-safe HMAC-SHA256 over `timestamp.payload`, plus a five-minute
 * replay window.
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

  const parts = new Map(
    signatureHeader.split(",").map((part) => {
      const [k, ...rest] = part.trim().split("=");
      return [k, rest.join("=")] as const;
    }),
  );

  const timestamp = parts.get("t");
  const signature = parts.get("v1");
  if (!timestamp || !signature) throw new Error("Malformed Stripe signature.");

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) {
    throw new Error("Stripe signature is outside the replay window.");
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Stripe signature does not match.");
  }

  const event = JSON.parse(payload) as {
    type: string;
    data: { object: Record<string, unknown> };
  };
  const object = event.data?.object ?? {};
  const metadata = (object.metadata ?? {}) as Record<string, string>;
  const orderNumber =
    metadata.orderNumber ?? (object.client_reference_id as string) ?? "";

  const amountFils = Number(object.amount_total ?? object.amount ?? 0);
  const amountAed = Number.isFinite(amountFils) ? amountFils / 100 : null;

  const outcome: WebhookResult["outcome"] =
    event.type === "checkout.session.completed" ||
    event.type === "payment_intent.succeeded"
      ? "PAID"
      : event.type === "payment_intent.payment_failed"
        ? "FAILED"
        : event.type === "charge.refunded"
          ? "REFUNDED"
          : "IGNORED";

  return {
    orderNumber,
    outcome,
    transactionId: (object.id as string) ?? null,
    amountAed,
    raw: { type: event.type },
  };
}
