"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ui/product-card";
import { GridIcon, PlusMinusIcon } from "@/components/ui/icons";
import type { Product } from "@/content/products";
import {
  SORTS,
  activeChips,
  applyFilters,
  applySort,
  facetsFor,
  toggleOption,
  type Selection,
  type Sort,
} from "@/lib/shop";
import { cn } from "@/lib/utils";

/** Tailwind needs the finished class name, so the densities are spelled out. */
const DENSITY = {
  2: { grid: "grid-cols-2 nav:grid-cols-2", sizes: "(max-width: 860px) 47vw, 50vw" },
  3: { grid: "grid-cols-2 nav:grid-cols-3", sizes: "(max-width: 860px) 47vw, 33vw" },
  4: { grid: "grid-cols-2 nav:grid-cols-4", sizes: "(max-width: 860px) 47vw, 25vw" },
} as const;

type Density = keyof typeof DENSITY;

/**
 * The shop grid and the bar above it: filter, sort, the running count, the
 * chips for what is ticked, and the density switch.
 *
 * Everything is held in this component rather than in the URL. A shop page is
 * one grid of a few dozen pieces, so filtering is instant and there is nothing
 * to fetch — pushing each tick into the address bar would only add a history
 * entry per click. `initialCategory` is the one exception: the home page hands
 * a category over as `?category=`, and the page reads it on the server and
 * passes it down here as the starting selection.
 */
export function CollectionGrid({
  products,
  initialCategory,
}: {
  products: Product[];
  initialCategory?: string;
}) {
  const facets = useMemo(() => facetsFor(products), [products]);

  const [selection, setSelection] = useState<Selection>(() => {
    const known = facets
      .find((f) => f.id === "category")
      ?.options.some((o) => o.label === initialCategory);
    return known && initialCategory ? { category: [initialCategory] } : {};
  });
  const [sort, setSort] = useState<Sort>("Featured");
  const [density, setDensity] = useState<Density>(4);
  const [openPanel, setOpenPanel] = useState<"filter" | "sort" | null>(null);

  const shown = useMemo(
    () => applySort(applyFilters(products, facets, selection), sort),
    [products, facets, selection, sort],
  );

  const chips = activeChips(selection);

  return (
    <div>
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px]">
        {/* Filter on the left, sort on the right, a hairline under both — the
            same bar the rest of the trade uses, so it needs no explaining. */}
        <div className="flex items-center justify-between border-y border-line">
          <ToolbarButton
            label="Filter"
            open={openPanel === "filter"}
            disabled={facets.length === 0}
            onClick={() =>
              setOpenPanel((p) => (p === "filter" ? null : "filter"))
            }
          />
          <ToolbarButton
            label="Sort"
            open={openPanel === "sort"}
            align="right"
            onClick={() => setOpenPanel((p) => (p === "sort" ? null : "sort"))}
          />
        </div>

        {openPanel === "filter" && facets.length > 0 && (
          <div className="fz-rise grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-x-10 gap-y-8 border-b border-line py-8">
            {facets.map((facet) => (
              <fieldset key={facet.id} className="m-0 p-0 border-none">
                <legend className="mb-3 p-0 text-[12px] tracking-[0.24em] uppercase text-muted">
                  {facet.title}
                </legend>
                <div className="flex flex-col gap-2.5">
                  {facet.options.map((option) => {
                    const on =
                      selection[facet.id]?.includes(option.label) ?? false;
                    return (
                      <label
                        key={option.label}
                        className="flex items-center gap-2.5 cursor-pointer text-[14.5px] text-cocoa hover:text-ink"
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() =>
                            setSelection((s) =>
                              toggleOption(s, facet.id, option.label),
                            )
                          }
                          className="w-[15px] h-[15px] accent-[var(--fz-ink)] cursor-pointer"
                        />
                        <span className={cn(on && "text-ink")}>
                          {option.label}
                        </span>
                        <span className="text-[12.5px] text-muted tabular-nums">
                          ({option.count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        )}

        {openPanel === "sort" && (
          <div
            role="group"
            aria-label="Sort by"
            className="fz-rise flex flex-wrap justify-end gap-x-7 gap-y-3 border-b border-line py-6"
          >
            {SORTS.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={sort === name}
                onClick={() => {
                  setSort(name);
                  setOpenPanel(null);
                }}
                className={cn(
                  "bg-transparent border-none cursor-pointer text-[14px] tracking-[0.1em]",
                  sort === name
                    ? "text-ink underline underline-offset-4"
                    : "text-muted hover:text-ink",
                )}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {/* Count, then what is ticked, then how many across. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4">
          <span
            aria-live="polite"
            className="text-[13px] tracking-[0.14em] uppercase text-muted"
          >
            {shown.length} {shown.length === 1 ? "Product" : "Products"} Found
          </span>

          {chips.map((chip) => (
            <button
              key={`${chip.facet}-${chip.label}`}
              type="button"
              onClick={() =>
                setSelection((s) => toggleOption(s, chip.facet, chip.label))
              }
              aria-label={`Remove filter ${chip.label}`}
              className="flex items-center gap-2 border-l border-line pl-4 bg-transparent cursor-pointer text-[13px] tracking-[0.08em] text-ink hover:text-wine"
            >
              <span aria-hidden>&times;</span>
              {chip.label}
            </button>
          ))}

          {chips.length > 0 && (
            <button
              type="button"
              onClick={() => setSelection({})}
              className="rounded-full bg-ink text-cream px-4 py-1.5 text-[12.5px] tracking-[0.12em] cursor-pointer border-none"
            >
              &times; Clear all
            </button>
          )}

          <div className="ml-auto hidden nav:flex items-center gap-1">
            {([2, 3, 4] as const).map((columns) => (
              <button
                key={columns}
                type="button"
                onClick={() => setDensity(columns)}
                aria-pressed={density === columns}
                aria-label={`Show ${columns} products per row`}
                className={cn(
                  "bg-transparent border-none cursor-pointer p-2",
                  density === columns ? "text-ink" : "text-line hover:text-muted",
                )}
              >
                <GridIcon columns={columns} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="max-w-[var(--fz-container)] mx-auto px-[18px] py-[clamp(48px,8vw,110px)] text-center">
          <p className="m-0 font-display text-[clamp(20px,2.6vw,28px)]">
            Nothing matches that combination.
          </p>
          <p className="mt-3 mb-6 text-[15.5px] text-cocoa">
            Loosen a filter and the rail fills back up.
          </p>
          <button
            type="button"
            onClick={() => setSelection({})}
            className="bg-ink text-cream border-none cursor-pointer px-7 py-3.5 text-[13px] tracking-[0.18em] uppercase"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        /*
          The same tile block the home page uses: full-bleed from `nav` up with
          only the rows spaced, and two in a gutter below it so the pair on a
          phone never share a seam. Keyed on the layout so a change of filter,
          sort or density replays the rise-in rather than snapping.
        */
        <div
          key={`${chips.length}-${sort}-${density}-${shown.length}`}
          className={cn(
            "fz-rise grid px-[18px] gap-x-[14px] gap-y-10",
            "nav:px-0 nav:gap-x-0 nav:gap-y-9",
            DENSITY[density].grid,
          )}
        >
          {shown.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              ratio="2/3"
              sizes={DENSITY[density].sizes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** "FILTER +" / "SORT +", with the plus collapsing to a minus when open. */
function ToolbarButton({
  label,
  open,
  onClick,
  disabled = false,
  align = "left",
}: {
  label: string;
  open: boolean;
  onClick: () => void;
  disabled?: boolean;
  align?: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-expanded={open}
      className={cn(
        "flex items-center gap-2.5 bg-transparent border-none py-4",
        "text-[13px] tracking-[0.22em] uppercase",
        align === "right" && "flex-row-reverse",
        disabled
          ? "text-line cursor-default"
          : "text-ink cursor-pointer hover:text-gold-dark",
      )}
    >
      {label}
      <PlusMinusIcon open={open} />
    </button>
  );
}
