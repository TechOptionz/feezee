import "server-only";
import { PaymentMethod } from "@prisma/client";
import { contact, whatsappHref } from "@/lib/site";
import { formatPrice } from "@/lib/currency";
import { stripeProvider } from "@/modules/payments/stripe";
import type {
  PaymentContext,
  PaymentIntentResult,
  PaymentProvider,
} from "@/modules/payments/types";

export * from "@/modules/payments/types";
export { verifyStripeWebhook } from "@/modules/payments/stripe";

/**
 * Cash on delivery.
 *
 * Nothing happens online, which is the point: the order is placed, the stock is
 * held, and the money arrives with the rider. It is still the most common way
 * a UAE boutique gets paid, so it is a first-class provider rather than a
 * fallback.
 */
const codProvider: PaymentProvider = {
  method: PaymentMethod.COD,
  label: "Cash on Delivery",
  description: "Pay the rider when the parcel arrives. UAE addresses only.",
  isAvailable: () => true,

  async createIntent(context): Promise<PaymentIntentResult> {
    return {
      status: "PENDING",
      redirectUrl: null,
      transactionId: null,
      metadata: { collectAed: context.amountAed },
      customerInstructions: [
        `Have ${formatPrice(context.amountAed)} ready for the rider.`,
        "We confirm every cash order on WhatsApp before it is dispatched.",
      ],
    };
  },
};

/**
 * Direct bank transfer.
 *
 * The IBAN comes from the environment rather than the code: it is the one
 * number on this site that costs real money to get wrong, and it should be
 * changeable without a deploy or a pull request.
 */
const bankTransferProvider: PaymentProvider = {
  method: PaymentMethod.BANK_TRANSFER,
  label: "Bank Transfer",
  description: "Transfer to our UAE account and send the receipt on WhatsApp.",

  isAvailable() {
    return Boolean(process.env.BANK_TRANSFER_IBAN?.trim());
  },

  async createIntent(context): Promise<PaymentIntentResult> {
    const details = bankDetails();
    return {
      status: "PENDING",
      redirectUrl: null,
      transactionId: null,
      metadata: { iban: details.iban, bank: details.bankName },
      customerInstructions: [
        `Transfer ${formatPrice(context.amountAed)} to ${details.accountName}.`,
        `${details.bankName} — IBAN ${details.iban}`,
        `Use ${context.orderNumber} as the transfer reference.`,
        `Send the receipt to ${contact.whatsapp.display} on WhatsApp and we will dispatch the same day.`,
      ],
    };
  },
};

/** The shop's account, for the confirmation page and the receipt email. */
export function bankDetails() {
  return {
    accountName:
      process.env.BANK_TRANSFER_ACCOUNT_NAME?.trim() || contact.legalName,
    bankName: process.env.BANK_TRANSFER_BANK_NAME?.trim() || "Emirates NBD",
    iban: process.env.BANK_TRANSFER_IBAN?.trim() || "",
  };
}

/** A wa.me link that opens with the order number already typed. */
export function bankTransferWhatsAppHref(orderNumber: string, amountAed: number) {
  return whatsappHref(
    `Hello FEEZEE, I have transferred ${formatPrice(amountAed)} for order ${orderNumber}. Here is my receipt.`,
  );
}

const PROVIDERS: PaymentProvider[] = [
  stripeProvider,
  codProvider,
  bankTransferProvider,
];

/** The provider for a method, whether or not it is currently configured. */
export function paymentProvider(method: PaymentMethod): PaymentProvider {
  const found = PROVIDERS.find((p) => p.method === method);
  if (!found) throw new Error(`No payment provider for ${method}.`);
  return found;
}

export type PaymentOption = {
  method: PaymentMethod;
  label: string;
  description: string;
};

/**
 * The methods the checkout may actually offer.
 *
 * A provider that is not configured is left out entirely rather than shown and
 * then failing — an unconfigured Stripe key should mean "no card option today",
 * not "an error after the address is typed".
 */
export function availablePaymentOptions(): PaymentOption[] {
  return PROVIDERS.filter((p) => p.isAvailable()).map((p) => ({
    method: p.method,
    label: p.label,
    description: p.description,
  }));
}

/** Start a payment for an order that has just been written. */
export function createPaymentIntent(
  method: PaymentMethod,
  context: PaymentContext,
): Promise<PaymentIntentResult> {
  return paymentProvider(method).createIntent(context);
}
