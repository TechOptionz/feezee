"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { resolveReturnAction, type AdminFormState } from "@/app/actions/admin";

const IDLE: AdminFormState = { status: "idle" };

const NEXT_STATUS: Record<string, string[]> = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["RECEIVED", "REJECTED"],
  RECEIVED: ["REFUNDED", "REJECTED"],
  REFUNDED: [],
  REJECTED: [],
};

/**
 * Reviewing one return.
 *
 * The restock tick is separate from the refund amount on purpose: a piece that
 * came back marked is still refunded, but it does not go back on the rail. The
 * box disappears once it has been ticked and acted on, so the same garment can
 * never be restocked twice by saving the form again.
 */
export function ReturnActions({
  returnId,
  status,
  suggestedRefundAed,
  isRestocked,
  adminNotes,
}: {
  returnId: string;
  status: string;
  suggestedRefundAed: number;
  isRestocked: boolean;
  adminNotes: string | null;
}) {
  const [state, action] = useActionState(resolveReturnAction, IDLE);
  const options = NEXT_STATUS[status] ?? [];
  const [next, setNext] = useState(options[0] ?? status);

  if (options.length === 0) {
    return (
      <p className="m-0 text-[13px] leading-[1.7] text-taupe">
        This return is closed.
        {isRestocked
          ? " The pieces went back on the rail."
          : " The pieces were not restocked."}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <input type="hidden" name="returnId" value={returnId} />

      {state.status === "error" && state.message && (
        <p role="alert" className="m-0 text-[13px] text-wine-bright">
          {state.message}
        </p>
      )}
      {state.status === "ok" && state.message && (
        <p role="status" className="m-0 text-[13px] text-gold-light">
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
            Decision
          </span>
          <select
            name="status"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="border border-ink-line bg-ink px-3 py-2.5 text-[14px] text-champagne outline-none focus:border-gold"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option.toLowerCase()}
              </option>
            ))}
          </select>
        </label>

        {next === "REFUNDED" && (
          <label className="flex flex-col gap-2">
            <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
              Refund (AED)
            </span>
            <input
              name="refundAmountAed"
              type="number"
              step="0.01"
              min={0}
              defaultValue={suggestedRefundAed.toFixed(2)}
              className="border border-ink-line bg-transparent px-3 py-2.5 text-[14px] text-champagne outline-none focus:border-gold tabular-nums"
            />
          </label>
        )}
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
          Note to the customer (optional)
        </span>
        <textarea
          name="adminNotes"
          rows={2}
          defaultValue={adminNotes ?? ""}
          placeholder="Post to Shop 1-35, Madina Mall. We refund within two working days of it arriving."
          className="border border-ink-line bg-transparent px-3 py-2.5 text-[13.5px] leading-[1.7] text-champagne outline-none resize-y placeholder:text-taupe focus:border-gold"
        />
      </label>

      {!isRestocked && (
        <label className="flex items-center gap-2.5 text-[13.5px] text-sandstone cursor-pointer">
          <input
            type="checkbox"
            name="restock"
            className="w-[15px] h-[15px] accent-[var(--fz-gold)] cursor-pointer"
          />
          Put these pieces back on the rail
        </label>
      )}

      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start cursor-pointer border-none bg-gold px-6 py-3 text-[12px] tracking-[0.16em] uppercase text-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save decision"}
    </button>
  );
}
