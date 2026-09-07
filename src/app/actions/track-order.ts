"use server";

import { z } from "zod";
import { trackOrder, type TrackedOrder } from "@/modules/orders";

/**
 * Looking up a parcel without an account.
 *
 * The only public action on the site that reads an order, so it is written to
 * give away as little as it can: one message for every way of failing, the
 * order number and the email checked together, and a projection back that
 * carries no address, no phone and no payment record.
 *
 * There is no enumeration defence beyond that shared message, and there does
 * not need to be one — the order number is half the secret and the email is
 * the other half, and knowing both is what the confirmation email already
 * means.
 */

export type TrackState = {
  status: "idle" | "error" | "found";
  message?: string;
  fieldErrors?: Record<string, string>;
  order?: TrackedOrder;
  /** Echoed back so the form keeps what was typed after a failed lookup. */
  values?: { orderNumber: string; email: string };
};

export const IDLE_TRACK: TrackState = { status: "idle" };

/** The one thing this action ever says when it will not show an order. */
const NOT_FOUND =
  "No order found matching those details. Please check your order confirmation email.";

const trackSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(1, "Enter the order number from your confirmation email."),
  email: z.email("Enter the email address you ordered with."),
});

export async function trackOrderAction(
  _previous: TrackState,
  formData: FormData,
): Promise<TrackState> {
  const values = {
    orderNumber: String(formData.get("orderNumber") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
  };

  const parsed = trackSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", fieldErrors, values };
  }

  try {
    const order = await trackOrder(parsed.data.orderNumber, parsed.data.email);
    if (!order) return { status: "error", message: NOT_FOUND, values };
    return { status: "found", order, values };
  } catch (error) {
    console.error("[track-order]", error);
    return {
      status: "error",
      message: "We could not reach your order just now. Please try again.",
      values,
    };
  }
}
