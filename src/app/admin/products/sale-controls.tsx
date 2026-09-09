"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  putOnSaleAction,
  removeFromSaleAction,
  type AdminFormState,
} from "@/app/actions/admin";
import { cn } from "@/lib/utils";

/**
 * Putting a piece on sale, in one click, from wherever the buyer is standing.
 *
 * The same control serves the products table and the product editor, because
 * marking something down is a decision made while scanning a list at least as
 * often as while editing a garment, and having to open a form, find two number
 * fields and work out 30% of 1,290 in your head is how a sale ends up with a
 * price nobody meant.
 *
 * It deliberately does not use a `<form>`. In the editor this sits inside the
 * product form, and a nested form is invalid HTML — the browser drops it and
 * the buttons quietly start submitting the wrong thing. Buttons calling the
 * action directly work in both places, and every one of them is `type="button"`
 * so it never submits the form it happens to be standing in.
 */

/** The reductions a buyer actually reaches for. Anything else is typed. */
const PRESETS = [15, 20, 30, 40, 50] as const;

export function SaleControls({
  productId,
  aed,
  wasAed,
  variant = "row",
}: {
  productId: number;
  aed: number;
  wasAed: number | null;
  variant?: "row" | "form";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const box = useRef<HTMLSpanElement>(null);

  const onSale = wasAed !== null && wasAed > aed;

  // A panel that hangs over the row below it has to close on the next click
  // elsewhere, or it covers the row the buyer is trying to read next.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function run(action: () => Promise<AdminFormState>) {
    setError(null);
    start(async () => {
      const result = await action();
      if (result.status === "error") {
        setError(result.message ?? "That did not go through.");
        return;
      }
      setOpen(false);
      setCustom("");
      // `revalidatePath` clears the server's copy; this is what makes the row
      // the buyer is looking at redraw with the price they just set.
      router.refresh();
    });
  }

  function applyCustom() {
    const price = Number(custom);
    if (!custom.trim() || !Number.isFinite(price) || price <= 0) {
      setError("Enter a price in AED.");
      return;
    }
    run(() => putOnSaleAction(productId, undefined, price));
  }

  if (onSale) {
    return (
      <span
        className={cn(
          "inline-flex flex-col",
          variant === "row" ? "items-end" : "items-start",
        )}
      >
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => removeFromSaleAction(productId))}
          className={cn(
            "cursor-pointer whitespace-nowrap text-[11.5px] tracking-[0.14em] uppercase text-wine-bright disabled:cursor-not-allowed disabled:opacity-60",
            variant === "row"
              ? "border-none bg-transparent p-0 hover:text-champagne"
              : "border border-wine/50 bg-wine/10 px-5 py-2.5 hover:border-wine-bright",
          )}
        >
          {pending ? "Ending…" : "End sale"}
        </button>
        {error && <Note>{error}</Note>}
      </span>
    );
  }

  return (
    <span
      ref={box}
      className={cn(
        "inline-flex flex-col",
        variant === "row" ? "items-end" : "items-start",
      )}
    >
      <button
        type="button"
        disabled={pending}
        aria-expanded={open}
        onClick={() => setOpen((was) => !was)}
        className={cn(
          "cursor-pointer whitespace-nowrap text-[11.5px] tracking-[0.14em] uppercase disabled:cursor-not-allowed disabled:opacity-60",
          variant === "row"
            ? "border-none bg-transparent p-0 text-taupe hover:text-gold-light"
            : "border border-ink-border bg-transparent px-5 py-2.5 text-sandstone hover:border-gold hover:text-gold-light",
        )}
      >
        {pending ? "Reducing…" : "Put on sale"}
      </button>

      {error && !open && <Note>{error}</Note>}

      {/*
        The panel stays in the flow and pushes the row taller rather than
        floating over it. A popover would be tidier, but the products table
        scrolls sideways inside `TableWrap`, and an absolutely positioned panel
        inside an overflow container is clipped at the row's edge — the presets
        would come out as half a panel with a scrollbar under them.
      */}
      {open && (
        <span
          className={cn(
            "mt-2 block w-[250px] border border-ink-border bg-ink p-4 text-left",
            variant === "row" && "shadow-[0_18px_40px_rgba(0,0,0,0.45)]",
          )}
        >
          <span className="mb-3 block text-[11px] tracking-[0.16em] uppercase text-taupe">
            Off {formatAed(aed)}
          </span>

          <span className="flex flex-wrap gap-2">
            {PRESETS.map((pct) => (
              <button
                key={pct}
                type="button"
                disabled={pending}
                onClick={() => run(() => putOnSaleAction(productId, pct))}
                className="cursor-pointer border border-ink-line bg-transparent px-2.5 py-2 text-[12px] tabular-nums text-champagne hover:border-gold hover:text-gold-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pct}%
                <span className="ml-1.5 text-taupe">
                  {formatAed(aed * (1 - pct / 100))}
                </span>
              </button>
            ))}
          </span>

          <span className="mt-3 block border-t border-ink-line pt-3">
            <label className="flex flex-col gap-2">
              <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
                Or a price
              </span>
              <span className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={custom}
                  onChange={(event) => setCustom(event.target.value)}
                  onKeyDown={(event) => {
                    // Enter here means "apply this price", not "save the
                    // product" — which is what the surrounding form would
                    // otherwise take it for in the editor.
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    applyCustom();
                  }}
                  placeholder="AED"
                  className="w-full min-w-0 border border-ink-line bg-transparent px-2.5 py-2 text-[13.5px] text-champagne outline-none placeholder:text-taupe focus:border-gold"
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={applyCustom}
                  className="cursor-pointer border-none bg-gold px-3.5 py-2 text-[11px] tracking-[0.14em] uppercase text-ink disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Set
                </button>
              </span>
            </label>
          </span>

          {error && <Note>{error}</Note>}
        </span>
      )}
    </span>
  );
}

/** The wine ticket: how deep the cut is, wherever the piece is listed. */
export function SalePill({ aed, wasAed }: { aed: number; wasAed: number | null }) {
  if (wasAed === null || wasAed <= aed) return null;
  return (
    <span className="inline-block whitespace-nowrap border border-wine/50 bg-wine/15 px-2 py-0.5 text-[11px] tracking-[0.1em] tabular-nums text-wine-bright">
      −{Math.round((1 - aed / wasAed) * 100)}%
    </span>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <span role="alert" className="mt-2 block text-[12px] leading-[1.5] text-wine-bright">
      {children}
    </span>
  );
}

/** Enough of a price to preview a reduction; the shop formats it properly. */
function formatAed(value: number): string {
  return `AED ${Math.round(value).toLocaleString("en-AE")}`;
}
