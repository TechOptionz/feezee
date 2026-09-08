/**
 * Where a parcel has got to, as five stops on a line.
 *
 * Deliberately without `server-only`, and deliberately structural rather than
 * typed against `OrderView`: the guest tracking page renders the same track
 * from a client component, off a trimmed projection that carries no customer
 * id and no payment transactions. Both callers satisfy `TimelineOrder`, so
 * there is one definition of what the five steps are and when each is done.
 */

/** Everything the track needs, and nothing else an order happens to hold. */
export type TimelineOrder = {
  paymentMethod: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  placedAt: string;
  paidAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
};

export type TimelineStep = { label: string; at: string | null; done: boolean };

export function orderTimeline(order: TimelineOrder): TimelineStep[] {
  return [
    { label: "Order placed", at: order.placedAt, done: true },
    {
      label: order.paymentMethod === "COD" ? "Payment on delivery" : "Payment received",
      at: order.paidAt,
      done: order.paymentStatus === "PAID",
    },
    {
      label: "Being prepared",
      at: null,
      done: ["PROCESSING", "DISPATCHED", "DELIVERED"].includes(
        order.fulfillmentStatus,
      ),
    },
    {
      label: "Dispatched",
      at: order.dispatchedAt,
      done: ["DISPATCHED", "DELIVERED"].includes(order.fulfillmentStatus),
    },
    {
      label: "Delivered",
      at: order.deliveredAt,
      done: order.fulfillmentStatus === "DELIVERED",
    },
  ];
}
