import { z } from "zod";
import { fromFils, round2, toFils } from "@/modules/shared/money";
import {
  DEFAULT_SETTINGS,
  type StoreSettings,
} from "@/modules/shared/store-policy";

/**
 * What a UAE checkout has to get right: where the parcel goes, and what the
 * order actually costs.
 *
 * No `server-only` here on purpose — the checkout form validates against the
 * same schema in the browser that the server action re-validates against, so
 * the customer sees "that is not a UAE mobile number" before they submit rather
 * than after. The server never trusts the client's copy; it just runs the
 * identical rules again.
 */

/** The seven emirates, in the order the dropdown lists them. */
export const EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
] as const;

export type Emirate = (typeof EMIRATES)[number];

/**
 * A UAE mobile number, in any of the shapes people actually type it.
 *
 * Accepts `+971 50 123 4567`, `00971501234567`, `0501234567` and `501234567`,
 * then normalises all of them to E.164 without the plus — the only form
 * `wa.me` takes, which is where every order confirmation ends up.
 * The mobile prefixes in service are 50, 52, 54, 55, 56 and 58.
 */
const UAE_MOBILE = /^(?:\+?971|0)?(5[024568])\d{7}$/;

export function normaliseUaePhone(input: string): string | null {
  const digits = input.replace(/[\s()\-.]/g, "");
  if (!UAE_MOBILE.test(digits)) return null;
  const local = digits.replace(/^(?:\+?971|0)/, "");
  return `971${local}`;
}

/** `971501234567` back to `+971 50 123 4567`, for printing. */
export function formatUaePhone(e164: string): string {
  const local = e164.replace(/^971/, "");
  if (local.length !== 9) return `+${e164}`;
  return `+971 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
}

const phoneField = z
  .string()
  .trim()
  .min(1, "A phone number is needed for the courier.")
  .transform((value, ctx) => {
    const normalised = normaliseUaePhone(value);
    if (!normalised) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a UAE mobile, e.g. +971 50 123 4567.",
      });
      return z.NEVER;
    }
    return normalised;
  });

/** The delivery half of the checkout form. */
export const shippingSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the full name for the parcel."),
  email: z.email("Enter an email we can send the receipt to."),
  phone: phoneField,
  emirate: z.enum(EMIRATES, { message: "Choose an emirate." }),
  city: z.string().trim().min(2, "Enter the area or city."),
  addressLine1: z
    .string()
    .trim()
    .min(4, "Enter the street, building or villa number."),
  addressLine2: z.string().trim().max(160).optional().or(z.literal("")),
  landmark: z.string().trim().max(160).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type ShippingInput = z.input<typeof shippingSchema>;
export type ShippingDetails = z.output<typeof shippingSchema>;

export const PAYMENT_METHODS = ["STRIPE", "COD", "BANK_TRANSFER"] as const;

export const checkoutSchema = shippingSchema.extend({
  paymentMethod: z.enum(PAYMENT_METHODS, { message: "Choose how to pay." }),
  /** Only meaningful for a signed-in customer; ignored for guests. */
  saveAddress: z.boolean().optional(),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutDetails = z.output<typeof checkoutSchema>;

// ---------------------------------------------------------------------------
// Totals
// ---------------------------------------------------------------------------

export type TotalsLine = { unitPriceAed: number; quantity: number };

export type OrderTotals = {
  subtotalAed: number;
  shippingFeeAed: number;
  vatAed: number;
  totalAed: number;
  /** How much more to spend for free delivery; 0 once it is earned. */
  toFreeShippingAed: number;
  freeShippingEarned: boolean;
};

/**
 * What the order costs.
 *
 * Two decisions worth stating, because both are visible on the invoice:
 *
 * 1. **VAT is charged on goods plus delivery.** UAE VAT treats the delivery
 *    charge as part of the consideration for the supply, so a 25 AED courier
 *    fee carries its own 1.25 AED of VAT. Charging VAT on the subtotal alone
 *    would under-collect on every order under the free-delivery threshold.
 * 2. **The threshold is tested against the subtotal**, before VAT — "free
 *    delivery over AED 1,000" is a promise about the price of the clothes, and
 *    a customer who reads it that way is right.
 *
 * All arithmetic is in fils, so the lines always add up to the total.
 */
export function calculateTotals(
  lines: readonly TotalsLine[],
  settings: StoreSettings = DEFAULT_SETTINGS,
): OrderTotals {
  const subtotalFils = lines.reduce(
    (sum, line) => sum + toFils(line.unitPriceAed) * line.quantity,
    0,
  );

  const thresholdFils = toFils(settings.freeShippingThresholdAed);
  const freeShippingEarned = subtotalFils >= thresholdFils && subtotalFils > 0;
  const shippingFils =
    subtotalFils === 0 || freeShippingEarned
      ? 0
      : toFils(settings.standardShippingFeeAed);

  const vatFils = Math.round((subtotalFils + shippingFils) * settings.vatRate);
  const totalFils = subtotalFils + shippingFils + vatFils;

  return {
    subtotalAed: fromFils(subtotalFils),
    shippingFeeAed: fromFils(shippingFils),
    vatAed: fromFils(vatFils),
    totalAed: fromFils(totalFils),
    toFreeShippingAed: freeShippingEarned
      ? 0
      : round2(fromFils(Math.max(0, thresholdFils - subtotalFils))),
    freeShippingEarned,
  };
}

/** The one address line an order stores and a courier reads. */
export function formatAddressLine(details: {
  addressLine1: string;
  addressLine2?: string | null;
}): string {
  return [details.addressLine1, details.addressLine2]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(", ");
}
