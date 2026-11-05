"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  openReturnForCustomerAction,
  type AdminFormState,
} from "@/app/actions/admin";
import { RETURN_REASONS } from "@/app/account/returns/return-form";
import { LABEL } from "@/app/admin/admin-ui";
import { cn } from "@/lib/utils";

const IDLE: AdminFormState = { status: "idle" };

/**
 * Opening a return for a customer who asked by WhatsApp or in the boutique.
 *
 * Folded away behind a button: most visits to an order are about getting it
 * out of the door, not back in. The identity reminder sits above the form
 * because this is the one place nothing checks the request comes from the
 * person who bought it — staff do, by the number messaging them.
 */
export function StartReturnPanel({
  orderId,
  customerPhone,
  daysLeft,
  items,
}: {
  orderId: string;
  /** Already formatted for reading, e.g. `+971 50 123 4567`. */
  customerPhone: string;
  daysLeft: number;
  items: { id: string; productName: string; variantSize: string; quantity: number }[];
}) {
  const [state, action] = useActionState(openReturnForCustomerAction, IDLE);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<Record<string, number>>({});

  if (state.status === "ok") {
    return (
      <p role="status" className="m-0 text-[13px] leading-[1.7] text-gold-light">
        {state.message}
      </p>
    );
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-3">
        <p className="m-0 text-[13px] leading-[1.7] text-taupe">
          {daysLeft} {daysLeft === 1 ? "day" : "days"} left of the return window. For a
          customer who asked on WhatsApp or at the boutique.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start cursor-pointer border border-ink-border bg-transparent px-5 py-2.5 text-[12px] font-medium tracking-[0.1em] uppercase text-sandstone hover:border-champagne hover:text-champagne"
        >
          Start a return
        </button>
      </div>
    );
  }

  const toggle = (id: string, max: number) =>
    setChosen((current) => {
      const next = { ...current };
      if (next[id]) delete next[id];
      else next[id] = max;
      return next;
    });

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <input type="hidden" name="orderId" value={orderId} />

      <p className="m-0 border border-gold/40 bg-gold/10 px-3.5 py-2.5 text-[12.5px] leading-[1.6] text-sandstone">
        Check the request is from <span className="text-champagne">{customerPhone}</span>{" "}
        — the number on this order — before opening it.
      </p>

      {state.status === "error" && state.message && (
        <p role="alert" className="m-0 text-[13px] text-wine-bright">
          {state.message}
        </p>
      )}

      <fieldset className="m-0 p-0 border-none flex flex-col gap-2">
        <legend className={cn(LABEL, "mb-2 p-0")}>What is coming back</legend>
        {items.map((item) => {
          const on = chosen[item.id] !== undefined;
          return (
            <div
              key={item.id}
              className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-2 border px-3 py-2.5 transition-colors",
                on ? "border-gold/60" : "border-ink-line",
              )}
            >
              <label className="flex flex-1 min-w-0 items-center gap-2.5 cursor-pointer text-[13.5px] text-sandstone">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(item.id, item.quantity)}
                  className="w-[15px] h-[15px] accent-[var(--fz-gold)] cursor-pointer"
                />
                <span className="min-w-0 truncate">
                  {item.productName} <span className="text-taupe">({item.variantSize})</span>
                </span>
              </label>
              {on && (
                <input
                  type="number"
                  name={`item:${item.id}`}
                  aria-label={`How many ${item.productName} are coming back`}
                  min={1}
                  max={item.quantity}
                  value={chosen[item.id]}
                  onChange={(e) =>
                    setChosen((c) => ({
                      ...c,
                      [item.id]: Math.max(1, Math.min(item.quantity, Number(e.target.value) || 1)),
                    }))
                  }
                  className="w-14 border border-ink-line bg-transparent px-2 py-1 text-[13.5px] text-champagne outline-none focus:border-gold tabular-nums"
                />
              )}
            </div>
          );
        })}
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className={LABEL}>Reason</span>
        <select
          name="reason"
          required
          defaultValue=""
          className="border border-ink-line bg-admin-surface px-3 py-2.5 text-[14px] text-champagne outline-none focus:border-gold"
        >
          <option value="" disabled>
            Choose a reason
          </option>
          {RETURN_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>
        {state.fieldErrors?.reason && (
          <span role="alert" className="text-[12.5px] text-wine-bright">
            {state.fieldErrors.reason}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-2">
        <span className={LABEL}>What the customer said (optional)</span>
        <textarea
          name="customerNotes"
          rows={2}
          placeholder="Asked on WhatsApp — the dupatta has a pulled thread."
          className="border border-ink-line bg-transparent px-3 py-2.5 text-[14px] leading-[1.7] text-champagne outline-none resize-y placeholder:text-taupe focus:border-gold"
        />
      </label>

      <div className="flex items-center gap-4">
        <Submit />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer border-none bg-transparent p-0 text-[12px] font-medium tracking-[0.1em] uppercase text-taupe hover:text-champagne"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="cursor-pointer border-none bg-gold px-6 py-3 text-[12px] font-semibold tracking-[0.12em] uppercase text-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Opening…" : "Open return"}
    </button>
  );
}
