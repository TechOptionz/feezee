import type { TrackedOrder } from "@/modules/orders";

/**
 * The shape the tracking form and its action pass between them.
 *
 * Kept out of `track-order.ts` because a `"use server"` file may only export
 * async functions — the initial state below is a plain object, so it has to
 * live somewhere the compiler will let it be a value.
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
