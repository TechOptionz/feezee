"use client";

import { useState } from "react";
import { StockAdjuster, type AdjustTarget } from "@/app/admin/inventory/stock-adjuster";
import { cn } from "@/lib/utils";

export type InventoryRow = {
  variantId: string;
  productId: number;
  productName: string;
  collection: string;
  size: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  isArchived: boolean;
};

/**
 * The variant matrix.
 *
 * A flat row per size rather than a grid of products across sizes: a shop with
 * four lines and six sizes has 126 cells, and a table that can be sorted,
 * filtered and read one line at a time beats a grid nobody can scan. The number
 * itself is the button — the thing you want to change is the thing you click.
 */
export function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  const [target, setTarget] = useState<AdjustTarget | null>(null);

  return (
    <>
      <StockAdjuster target={target} onClose={() => setTarget(null)} />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Piece", "Line", "Size", "SKU", "Status"].map((head) => (
                <th
                  key={head}
                  scope="col"
                  className="whitespace-nowrap border-b border-ink-line py-2.5 pr-5 text-left text-[11.5px] font-medium tracking-[0.12em] uppercase text-taupe"
                >
                  {head}
                </th>
              ))}
              <th
                scope="col"
                className="whitespace-nowrap border-b border-ink-line py-2.5 text-right text-[11.5px] font-medium tracking-[0.12em] uppercase text-taupe"
              >
                Stock
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[14px] text-taupe">
                  Nothing matches that.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const out = row.stock === 0;
                const low = !out && row.stock <= row.lowStockThreshold;

                return (
                  <tr key={row.variantId}>
                    <td className="border-b border-ink-line/70 py-3 pr-5 text-[14px] font-medium text-champagne">
                      {row.productName}
                      {row.isArchived && (
                        <span className="ml-2 text-[11px] font-medium tracking-[0.08em] uppercase text-taupe">
                          archived
                        </span>
                      )}
                    </td>
                    <td className="border-b border-ink-line/70 py-3 pr-5 text-[13.5px] text-sandstone">
                      {row.collection}
                    </td>
                    <td className="border-b border-ink-line/70 py-3 pr-5 text-[14px] font-medium text-sandstone">
                      {row.size}
                    </td>
                    <td className="border-b border-ink-line/70 py-3 pr-5 text-[13px] tabular-nums text-taupe">
                      {row.sku}
                    </td>
                    <td className="border-b border-ink-line/70 py-3 pr-5">
                      <span
                        className={cn(
                          "inline-block border px-2.5 py-[3px] text-[11px] font-medium tracking-[0.08em] uppercase",
                          out
                            ? "border-wine/50 bg-wine/10 text-wine-bright"
                            : low
                              ? "border-gold/50 bg-gold/10 text-gold-light"
                              : "border-ink-border bg-admin-raised/60 text-sandstone",
                        )}
                      >
                        {out ? "Sold out" : low ? "Low" : "In stock"}
                      </span>
                    </td>
                    <td className="border-b border-ink-line/70 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setTarget({
                            variantId: row.variantId,
                            productName: row.productName,
                            size: row.size,
                            sku: row.sku,
                            stock: row.stock,
                          })
                        }
                        aria-label={`Adjust stock for ${row.productName}, size ${row.size} — currently ${row.stock}`}
                        className={cn(
                          "min-w-[56px] cursor-pointer border bg-admin-raised px-3 py-1.5 text-[15px] font-semibold tabular-nums transition-colors",
                          out
                            ? "border-wine/50 text-wine-bright hover:border-wine"
                            : low
                              ? "border-gold/50 text-gold-light hover:border-gold"
                              : "border-ink-border text-champagne hover:border-gold",
                        )}
                      >
                        {row.stock}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
