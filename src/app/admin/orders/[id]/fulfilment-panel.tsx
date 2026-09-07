"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateOrderStatusAction,
  updatePaymentStatusAction,
  type AdminFormState,
} from "@/app/actions/admin";
import { cn } from "@/lib/utils";

const IDLE: AdminFormState = { status: "idle" };

/**
 * Moving one order along.
 *
 * The status list is the one the state machine says is legal from here, worked
 * out on the server — so an order that has shipped simply never offers
 * "pending" rather than offering it and failing. Dispatch reveals the courier
 * fields, because a tracking number is required to reach that state and asking
 * for one on every transition would be noise.
 */
export function FulfilmentPanel({
  orderId,
  current,
  paymentStatus,
  allowed,
  couriers,
  courierName,
  trackingNumber,
}: {
  orderId: string;
  current: string;
  paymentStatus: string;
  allowed: string[];
  couriers: string[];
  courierName: string | null;
  trackingNumber: string | null;
}) {
  const [state, action] = useActionState(updateOrderStatusAction, IDLE);
  const [payState, payAction] = useActionState(updatePaymentStatusAction, IDLE);
  const [next, setNext] = useState(allowed[0] ?? "");

  return (
    <div className="flex flex-col gap-4">
      {allowed.length === 0 ? (
        <p className="m-0 border border-ink-line px-4 py-3 text-[13.5px] leading-[1.7] text-taupe">
          This order is {current.toLowerCase()} — there is nowhere left for it to
          go. A delivered order that comes back is handled as a return.
        </p>
      ) : (
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="orderId" value={orderId} />

          {state.status === "error" && state.message && (
            <p
              role="alert"
              className="m-0 border border-wine/50 bg-wine/10 px-4 py-3 text-[13px] text-wine-bright"
            >
              {state.message}
            </p>
          )}
          {state.status === "ok" && state.message && (
            <p
              role="status"
              className="m-0 border border-gold/40 bg-gold/10 px-4 py-3 text-[13px] text-gold-light"
            >
              {state.message}
            </p>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
              Move to
            </span>
            <select
              name="status"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="border border-ink-line bg-ink px-3 py-2.5 text-[14px] text-champagne outline-none focus:border-gold"
            >
              {allowed.map((option) => (
                <option key={option} value={option}>
                  {option.toLowerCase().replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>

          {next === "DISPATCHED" && (
            <div className="flex flex-col gap-4 border border-ink-line p-4">
              <label className="flex flex-col gap-2">
                <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
                  Courier
                </span>
                <select
                  name="courierName"
                  defaultValue={courierName ?? couriers[0]}
                  required
                  className="border border-ink-line bg-ink px-3 py-2.5 text-[14px] text-champagne outline-none focus:border-gold"
                >
                  {couriers.map((courier) => (
                    <option key={courier} value={courier}>
                      {courier}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
                  Tracking number
                </span>
                <input
                  name="trackingNumber"
                  defaultValue={trackingNumber ?? ""}
                  required
                  className="border border-ink-line bg-transparent px-3 py-2.5 text-[14px] text-champagne outline-none placeholder:text-taupe focus:border-gold"
                />
              </label>

              <p className="m-0 text-[12.5px] leading-[1.6] text-taupe">
                Saving this emails the customer their tracking link.
              </p>
            </div>
          )}

          {next === "CANCELLED" && (
            <p className="m-0 border border-wine/40 bg-wine/10 px-4 py-3 text-[13px] leading-[1.7] text-wine-bright">
              Cancelling puts every piece on this order back on the rail.
            </p>
          )}

          <Submit
            label={next === "CANCELLED" ? "Cancel order" : "Update order"}
            danger={next === "CANCELLED"}
          />
        </form>
      )}

      <form action={payAction} className="flex flex-col gap-3 border-t border-ink-line pt-4">
        <input type="hidden" name="orderId" value={orderId} />

        {payState.status === "error" && payState.message && (
          <p role="alert" className="m-0 text-[13px] text-wine-bright">
            {payState.message}
          </p>
        )}
        {payState.status === "ok" && payState.message && (
          <p role="status" className="m-0 text-[13px] text-gold-light">
            {payState.message}
          </p>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
            Payment
          </span>
          <select
            name="paymentStatus"
            defaultValue={paymentStatus}
            className="border border-ink-line bg-ink px-3 py-2.5 text-[14px] text-champagne outline-none focus:border-gold"
          >
            {["PENDING", "PAID", "REFUNDED", "FAILED"].map((option) => (
              <option key={option} value={option}>
                {option.toLowerCase()}
              </option>
            ))}
          </select>
        </label>

        <Submit label="Update payment" subtle />
        <p className="m-0 text-[12px] leading-[1.6] text-taupe">
          For a bank transfer that has landed, or cash the rider brought back.
          Card payments update themselves from the Stripe webhook.
        </p>
      </form>
    </div>
  );
}

function Submit({
  label,
  danger = false,
  subtle = false,
}: {
  label: string;
  danger?: boolean;
  subtle?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "cursor-pointer px-6 py-3 text-[12px] tracking-[0.16em] uppercase disabled:cursor-not-allowed disabled:opacity-60",
        danger
          ? "border border-wine bg-transparent text-wine-bright hover:bg-wine/15"
          : subtle
            ? "border border-ink-border bg-transparent text-sandstone hover:border-champagne hover:text-champagne"
            : "border-none bg-gold text-ink",
      )}
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
