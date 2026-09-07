"use client";

import { useActionState, useState } from "react";
import { requestReturnAction } from "@/app/actions/account";
import {
  FormMessage,
  IDLE_FORM,
  SubmitButton,
  TextArea,
} from "@/components/forms/form-kit";
import { cn } from "@/lib/utils";

const REASONS = [
  "Too small",
  "Too large",
  "Not as pictured",
  "Arrived damaged",
  "Changed my mind",
  "Wrong piece sent",
] as const;

/**
 * Asking to send something back.
 *
 * The quantity per line is a number input rather than "return the whole line",
 * because a customer who bought two of a kurta and wants to keep one is the
 * ordinary case, not an exception. Unticked lines submit nothing at all, which
 * is what the action reads to decide what is actually coming back.
 */
export function ReturnRequestForm({
  orderId,
  items,
}: {
  orderId: string;
  items: { id: string; productName: string; variantSize: string; quantity: number }[];
}) {
  const [state, action] = useActionState(requestReturnAction, IDLE_FORM);
  const [chosen, setChosen] = useState<Record<string, number>>({});

  const toggle = (id: string, max: number) =>
    setChosen((current) => {
      const next = { ...current };
      if (next[id]) delete next[id];
      else next[id] = max;
      return next;
    });

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="orderId" value={orderId} />
      <FormMessage state={state} />

      <fieldset className="m-0 p-0 border-none">
        <legend className="mb-3 p-0 text-[12px] tracking-[0.18em] uppercase text-muted">
          What is coming back
        </legend>

        <div className="flex flex-col gap-2.5">
          {items.map((item) => {
            const on = chosen[item.id] !== undefined;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-wrap items-center gap-x-4 gap-y-2 border p-3.5 transition-colors",
                  on ? "border-ink bg-panel" : "border-line",
                )}
              >
                <label className="flex flex-1 min-w-0 items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(item.id, item.quantity)}
                    className="w-[15px] h-[15px] accent-[var(--fz-ink)] cursor-pointer"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] text-ink">
                      {item.productName}
                    </span>
                    <span className="block text-[12.5px] text-muted">
                      Size {item.variantSize} · {item.quantity} ordered
                    </span>
                  </span>
                </label>

                {on && (
                  <label className="flex items-center gap-2 text-[12.5px] text-muted">
                    Returning
                    <input
                      type="number"
                      name={`item:${item.id}`}
                      min={1}
                      max={item.quantity}
                      value={chosen[item.id]}
                      onChange={(e) =>
                        setChosen((c) => ({
                          ...c,
                          [item.id]: Math.max(
                            1,
                            Math.min(item.quantity, Number(e.target.value) || 1),
                          ),
                        }))
                      }
                      className="w-16 border border-line bg-transparent px-2 py-1.5 text-[14px] text-ink outline-none focus:border-gold tabular-nums"
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-[12px] tracking-[0.18em] uppercase text-muted">
          Reason
        </span>
        <select
          name="reason"
          required
          defaultValue=""
          className="border border-line bg-transparent px-3.5 py-3 text-[15px] text-ink outline-none focus:border-gold"
        >
          <option value="" disabled>
            Choose a reason
          </option>
          {REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>
        {state.fieldErrors?.reason && (
          <span role="alert" className="text-[12.5px] text-wine">
            {state.fieldErrors.reason}
          </span>
        )}
      </label>

      <TextArea
        label="Anything else we should know (optional)"
        name="customerNotes"
        placeholder="The embroidery on the left sleeve has pulled."
      />

      <SubmitButton pendingLabel="Sending…" className="self-start">
        Request return
      </SubmitButton>

      <p className="m-0 text-[12.5px] leading-[1.6] text-muted">
        We review every request by hand and reply on WhatsApp within a working
        day. Nothing needs to be posted until it is approved.
      </p>
    </form>
  );
}
