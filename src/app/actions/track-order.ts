"use server";

import { z } from "zod";
import { orderNumberNeedsEmail, trackOrder } from "@/modules/orders";
import type { TrackState } from "@/app/actions/track-order-state";
import { callerKey, createRateLimit } from "@/lib/rate-limit";

/**
 * Looking up a parcel without an account.
 *
 * The only public action on the site that reads an order, so it is written to
 * give away as little as it can: one message for every way of failing, and a
 * projection back that carries no address, no phone and no payment record.
 *
 * **A current order number is the whole credential.** The email field is kept
 * and checked when filled in, but it is optional — asking someone to remember
 * which address they checked out with is exactly the friction this page exists
 * to remove. The random half of the order number is what makes that safe, and
 * the throttle below is what keeps it safe against someone willing to sit and
 * guess at it.
 *
 * Order numbers issued before that random half are the exception, and still
 * require the email: see `trackOrder`.
 */

/** The one thing this action ever says when it will not show an order. */
const NOT_FOUND =
  "No order found matching those details. Please check your order confirmation email.";

const trackSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(1, "Enter the order number from your confirmation email."),
  /*
   * Optional, but still validated when present: a half-typed address should be
   * corrected on the spot rather than silently ignored and then reported as
   * "no order found", which would send the customer hunting for the wrong
   * mistake.
   */
  email: z
    .union([z.email("Enter a valid email, or leave it blank."), z.literal("")])
    .optional(),
});

/**
 * A crude throttle on guessing.
 *
 * Four random characters is around 920,000 combinations, which stops anyone
 * walking the order run but would not stop a script pointed at one number all
 * afternoon. Twenty lookups a minute makes that take about a month per order,
 * and is far above anything a real customer does — a shared mall or office
 * connection can check a dozen parcels a minute without noticing this exists.
 *
 * In memory and per instance — see `createRateLimit` for what that does and
 * does not buy.
 */
const throttled = createRateLimit({ windowMs: 60_000, max: 20 });

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

  /*
   * Older order numbers are pure sequence and can be guessed from one another,
   * so they need the email as well. Asked for on the shape of what was typed
   * rather than on whether the order turns out to exist — the shape is already
   * visible to whoever typed it, so saying so reveals nothing, and the
   * alternative is a customer with a genuine old order being told "no order
   * found" and hunting for a mistake they did not make.
   */
  if (!parsed.data.email && orderNumberNeedsEmail(parsed.data.orderNumber)) {
    return {
      status: "error",
      fieldErrors: {
        email:
          "Orders placed before we added the four letters on the end of the order number need the email address too.",
      },
      values,
    };
  }

  // Counted after validation, so a fumbled email does not spend an attempt.
  if (throttled(await callerKey())) {
    return {
      status: "error",
      message:
        "That is a lot of lookups at once. Please wait a minute and try again, or message us on WhatsApp with your order number.",
      values,
    };
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
