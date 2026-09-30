"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProductAction } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

/**
 * Deleting a piece, from the products table or from its editor.
 *
 * Two clicks, on purpose. Archive sits right beside this and can be undone;
 * this cannot, so the first click only asks the question and the second one —
 * on a differently worded button, in a different place — is what deletes.
 *
 * Like the sale control it is buttons calling the action rather than a
 * `<form>`: in the editor it stands inside the product form, where a nested
 * form would be invalid HTML.
 */
export function DeleteProduct({
  productId,
  name,
  variant = "row",
}: {
  productId: number;
  name: string;
  variant?: "row" | "form";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function remove() {
    setError(null);
    start(async () => {
      const result = await deleteProductAction(productId);
      if (result.status === "error") {
        setError(result.message ?? "That did not go through.");
        setAsking(false);
        return;
      }
      // The editor's own page is gone with the piece, so it goes back to the
      // list; the list only needs to redraw without the row.
      if (variant === "form") router.push("/admin/products");
      router.refresh();
    });
  }

  return (
    <span
      className={cn(
        "inline-flex flex-col",
        variant === "row" ? "items-end" : "items-start",
      )}
    >
      {asking ? (
        <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[12.5px] text-sandstone">
            Delete {name} for good?
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={remove}
            className="cursor-pointer whitespace-nowrap border border-wine/50 bg-wine/10 px-3 py-1.5 text-[12px] font-medium tracking-[0.1em] uppercase text-wine-bright hover:border-wine-bright disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Deleting…" : "Yes, delete"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setAsking(false)}
            className="cursor-pointer border-none bg-transparent p-0 text-[12px] font-medium tracking-[0.1em] uppercase text-taupe hover:text-champagne disabled:cursor-not-allowed disabled:opacity-60"
          >
            Keep
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setAsking(true);
          }}
          className={cn(
            "cursor-pointer whitespace-nowrap text-[12px] font-medium tracking-[0.1em] uppercase",
            variant === "row"
              ? "border-none bg-transparent p-0 text-taupe hover:text-wine-bright"
              : "border border-wine/50 bg-transparent px-5 py-2.5 text-wine-bright hover:border-wine-bright",
          )}
        >
          Delete
        </button>
      )}

      {error && (
        <span
          role="alert"
          className={cn(
            "mt-2 block max-w-[320px] text-[12px] leading-[1.5] text-wine-bright",
            variant === "row" && "text-right",
          )}
        >
          {error}
        </span>
      )}
    </span>
  );
}
