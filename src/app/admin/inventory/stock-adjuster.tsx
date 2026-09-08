"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { adjustStockAction, type AdminFormState } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

const IDLE: AdminFormState = { status: "idle" };

const REASONS = [
  { value: "RESTOCK", label: "Restock — new pieces in from the workshop" },
  { value: "MANUAL_AUDIT", label: "Audit — recounted on the shop floor" },
  { value: "DAMAGED", label: "Damaged — written off, not sellable" },
  { value: "RETURN_RESTOCK", label: "Return — came back and went out again" },
] as const;

export type AdjustTarget = {
  variantId: string;
  productName: string;
  size: string;
  sku: string;
  stock: number;
};

/**
 * The stock adjustment dialog.
 *
 * A reason is required, not optional. Every row it writes lands in the ledger
 * beside the balance it produced, and "someone changed it to 4" without a why
 * is the entry that makes a stock take impossible six weeks later.
 *
 * It is a real `<dialog>`: Escape, the backdrop and focus containment all come
 * from the platform rather than from a hand-rolled overlay.
 */
export function StockAdjuster({
  target,
  onClose,
}: {
  target: AdjustTarget | null;
  onClose: () => void;
}) {
  const [state, action] = useActionState(adjustStockAction, IDLE);
  const ref = useRef<HTMLDialogElement>(null);

  /*
   * Derived, not stored. The action's state survives the dialog closing, so the
   * confirmation can simply be read off it — keeping it in `useState` as well
   * would be a second copy of the same fact, kept in sync by an effect.
   */
  const settled = state.status === "ok" ? state.message : null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (target && !dialog.open) dialog.showModal();
    if (!target && dialog.open) dialog.close();
  }, [target]);

  /*
   * Close on a successful save. This only touches the DOM — the dialog's own
   * `close` event is what tells the parent, so the page state changes from an
   * event handler rather than from inside an effect.
   */
  useEffect(() => {
    if (state.status === "ok") ref.current?.close();
  }, [state]);

  return (
    <>
      {settled && (
        <p
          role="status"
          className="mb-4 border border-gold/40 bg-gold/10 px-4 py-3 text-[13.5px] text-gold-light"
        >
          {settled}
        </p>
      )}

      <dialog
        ref={ref}
        onClose={onClose}
        aria-label="Adjust stock"
        className={cn(
          "m-auto w-[min(460px,calc(100vw-32px))] border border-ink-line bg-ink p-0 text-sandstone",
          "backdrop:bg-black/60",
        )}
      >
        {target && (
          <form action={action} className="flex flex-col gap-4 p-[clamp(20px,3vw,28px)]">
            <input type="hidden" name="variantId" value={target.variantId} />

            <div>
              <h2 className="m-0 font-display text-[20px] leading-tight text-champagne">
                {target.productName}
              </h2>
              <p className="m-0 mt-1.5 text-[12.5px] tracking-[0.12em] uppercase text-taupe">
                Size {target.size} · {target.sku}
              </p>
            </div>

            {state.status === "error" && state.message && (
              <p
                role="alert"
                className="m-0 border border-wine/50 bg-wine/10 px-4 py-3 text-[13px] text-wine-bright"
              >
                {state.message}
              </p>
            )}

            <div className="border border-ink-line px-4 py-3 text-[13.5px]">
              On the rail now:{" "}
              <span className="text-champagne tabular-nums">{target.stock}</span>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
                New count
              </span>
              <input
                name="stock"
                type="number"
                min={0}
                step={1}
                required
                defaultValue={target.stock}
                autoFocus
                className="border border-ink-line bg-transparent px-3 py-2.5 text-[15px] text-champagne outline-none focus:border-gold tabular-nums"
              />
              {state.fieldErrors?.stock && (
                <span role="alert" className="text-[12px] text-wine-bright">
                  {state.fieldErrors.stock}
                </span>
              )}
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
                Reason
              </span>
              <select
                name="reason"
                required
                defaultValue="RESTOCK"
                className="border border-ink-line bg-ink px-3 py-2.5 text-[14px] text-champagne outline-none focus:border-gold"
              >
                {REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
                Note (optional)
              </span>
              <input
                name="note"
                placeholder="Batch from Thursday"
                className="border border-ink-line bg-transparent px-3 py-2.5 text-[14px] text-champagne outline-none placeholder:text-taupe focus:border-gold"
              />
            </label>

            <div className="mt-1 flex items-center gap-3">
              <Save />
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer border-none bg-transparent p-0 text-[12px] tracking-[0.14em] uppercase text-taupe hover:text-champagne"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="cursor-pointer border-none bg-gold px-6 py-3 text-[12px] tracking-[0.16em] uppercase text-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save count"}
    </button>
  );
}
