import type { PaymentMethod } from "@/generated/prisma/enums";

/**
 * One interface, three very different ways of being paid.
 *
 * Stripe needs a round trip to a card sheet. Cash on delivery needs nothing at
 * all — the order is placed and the money arrives with the rider. A bank
 * transfer needs the shop's IBAN put in front of the customer and then a human
 * to confirm it landed. The order module should not have to know which of those
 * it is dealing with, so each provider answers the same three questions:
 * can I be offered, what happens when the order is placed, and how do I read a
 * webhook.
 */

export type PaymentIntentResult = {
  /** What to record on the order the moment it is placed. */
  status: "PAID" | "PENDING";
  /** Send the customer here to pay. Null when there is nothing to pay now. */
  redirectUrl: string | null;
  /** The provider's own id for this attempt, if it has one yet. */
  transactionId: string | null;
  /** Anything worth keeping on the PaymentTransaction row. */
  metadata?: Record<string, unknown>;
  /** Shown on the confirmation page — the IBAN, or "pay the rider". */
  customerInstructions: string[];
};

export type PaymentContext = {
  orderId: string;
  orderNumber: string;
  amountAed: number;
  customerEmail: string;
  customerName: string;
  /** Absolute origin, for building return URLs. */
  origin: string;
};

export type PaymentProvider = {
  method: PaymentMethod;
  /** The words on the radio button. */
  label: string;
  /** The line under it. */
  description: string;
  /**
   * False when the provider is not configured — no Stripe keys, say. An
   * unavailable provider is never offered, rather than offered and then failing
   * at the worst possible moment.
   */
  isAvailable(): boolean;
  /** Start the payment. Called inside order placement. */
  createIntent(context: PaymentContext): Promise<PaymentIntentResult>;
};

export type WebhookResult = {
  /** The order this event is about, by order number. */
  orderNumber: string;
  outcome: "PAID" | "FAILED" | "REFUNDED" | "IGNORED";
  transactionId: string | null;
  /**
   * The provider's id for the charge itself, when it differs from
   * `transactionId` — a Stripe Checkout Session is not the thing a refund is
   * issued against, the payment intent under it is. Kept so a refund months
   * later does not have to go looking for it.
   */
  paymentIntentId?: string | null;
  amountAed: number | null;
  /**
   * Kept as strings so it drops straight into the `metadata` Json column
   * without a cast — Prisma's `InputJsonValue` will not take `unknown`.
   */
  raw: Record<string, string>;
};
