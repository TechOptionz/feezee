"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ShareRow } from "@/components/product/share-row";
import { useStore } from "@/components/store/store-provider";
import { HeartIcon } from "@/components/ui/icons";
import { collectionHref } from "@/content/collections";
import {
  COLOUR_NOTE,
  defaultSize,
  productDetail,
  sizeGuide,
  sizeOptions,
  type Size,
} from "@/content/product-detail";
import { discountPct, productSku, type Product } from "@/content/products";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

const TABS = ["Details", "Description", "Size Guide"] as const;
type Tab = (typeof TABS)[number];

/**
 * The buying half of a garment's page: what it is, what it costs, which sizes
 * are left, and the one button that matters.
 *
 * Everything above the tabs is the decision; everything below it is the
 * evidence. That order is why the panel opens on a size already chosen — the
 * first one still on the rail — so the button is live the moment the page is.
 */
export function ProductPanel({
  product,
  /** Absolute URL of this page, for the share links. */
  url,
}: {
  product: Product;
  url: string;
}) {
  const { currency, addToBag, toggleWish, wished } = useStore();

  const detail = productDetail(product);
  const options = sizeOptions(product);
  const soldOut = options.every((option) => option.state === "out");
  const off = discountPct(product);

  const [size, setSize] = useState<Size | null>(() => defaultSize(product));
  const [missingSize, setMissingSize] = useState(false);
  const [tab, setTab] = useState<Tab>("Details");
  const tabsRef = useRef<HTMLDivElement>(null);

  const chosen = options.find((option) => option.size === size);
  const isWished = Boolean(wished[product.id]);

  /* "Size chart" is the same panel as the third tab rather than a dialog of
     its own: one copy of the table, and it stays open while sizes are tried. */
  const openSizeGuide = () => {
    setTab("Size Guide");
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const add = () => {
    if (soldOut) return;
    if (!size) {
      setMissingSize(true);
      return;
    }
    addToBag(product.id, 1, size);
  };

  return (
    <div className="flex flex-col">
      <p className="m-0 flex items-center gap-3 text-[12px] tracking-[0.3em] uppercase text-muted">
        <span
          aria-hidden
          className={cn(
            "h-px w-[clamp(18px,2vw,30px)]",
            product.collection === "Sale" ? "bg-wine/60" : "bg-gold/70",
          )}
        />
        <Link
          href={collectionHref(product.collection)}
          className="text-muted hover:text-ink"
        >
          {product.collection}
        </Link>
      </p>

      <h1 className="mt-[clamp(10px,1.4vw,16px)] mb-0 font-display font-normal text-[clamp(26px,2.6vw,38px)] leading-[1.12] uppercase tracking-[0.01em]">
        {product.name}
      </h1>

      <div className="mt-[clamp(12px,1.6vw,18px)] flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={cn(
            "text-[21px] font-medium",
            product.wasPkr && "text-wine",
          )}
        >
          {formatPrice(product.pkr, currency)}
        </span>
        {product.wasPkr && (
          <>
            <span className="text-[15px] text-muted line-through">
              {formatPrice(product.wasPkr, currency)}
            </span>
            {off && (
              <span className="text-[12px] tracking-[0.14em] uppercase text-wine">
                {off}% off
              </span>
            )}
          </>
        )}
      </div>

      <p className="mt-2.5 mb-0 text-[12px] tracking-[0.16em] uppercase text-muted">
        SKU: {productSku(product)}
        {size ? `-${size}` : ""}
      </p>

      <p className="mt-4 mb-0 text-[15.5px] leading-[1.7] text-cocoa">
        {detail.cut}. {product.fabric}.
      </p>

      {/* ---- Size ---------------------------------------------------------- */}
      <div className="mt-[clamp(22px,2.6vw,32px)] border-t border-line pt-[clamp(20px,2.4vw,28px)]">
        <div className="flex items-center justify-between gap-4">
          <p className="m-0 text-[12.5px] tracking-[0.2em] uppercase">
            Size:{" "}
            <span className="text-cocoa">{size ?? "Select a size"}</span>
            {chosen?.state === "low" && (
              <span className="ml-3 text-wine">Last few items</span>
            )}
          </p>

          <button
            type="button"
            onClick={openSizeGuide}
            className="bg-transparent border-0 border-b border-current p-0 cursor-pointer text-[12px] tracking-[0.16em] uppercase text-gold-dark hover:text-ink"
          >
            Size Chart
          </button>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-2">
          {options.map(({ size: value, state }) => {
            const out = state === "out";
            const selected = value === size;

            return (
              <button
                key={value}
                type="button"
                disabled={out}
                aria-pressed={selected}
                aria-label={
                  out ? `${value} — sold out` : `Choose size ${value}`
                }
                onClick={() => {
                  setSize(value);
                  setMissingSize(false);
                }}
                className={cn(
                  "relative min-w-[52px] px-3 py-2.5 text-[13px] tracking-[0.14em] uppercase border transition-colors duration-200",
                  out
                    ? "border-line text-muted/60 cursor-not-allowed line-through"
                    : "cursor-pointer",
                  !out && selected
                    ? "border-ink text-ink"
                    : !out && "border-line text-cocoa hover:border-ink hover:text-ink",
                )}
              >
                {value}
                {/* The last few of a size gets a dot rather than a word: the
                    word belongs to the size actually chosen, above. */}
                {state === "low" && (
                  <span
                    aria-hidden
                    className="absolute top-1 right-1 w-[5px] h-[5px] rounded-full bg-wine"
                  />
                )}
              </button>
            );
          })}
        </div>

        {missingSize && (
          <p className="mt-3 mb-0 text-[13px] text-wine" role="alert">
            Choose a size to add this to your bag.
          </p>
        )}
      </div>

      {/* ---- The button ---------------------------------------------------- */}
      <div className="mt-[clamp(20px,2.4vw,28px)] flex flex-col gap-3">
        <button
          type="button"
          onClick={add}
          disabled={soldOut}
          className={cn(
            "w-full px-7 py-4 text-[13px] tracking-[0.22em] uppercase border-0 transition-colors duration-200",
            soldOut
              ? "bg-sand text-muted cursor-not-allowed"
              : "bg-ink text-cream cursor-pointer hover:bg-cocoa",
          )}
        >
          {soldOut ? "Sold out" : "Add to Bag"}
        </button>

        <button
          type="button"
          onClick={() => toggleWish(product.id)}
          aria-pressed={isWished}
          className={cn(
            "w-full px-7 py-3.5 text-[12.5px] tracking-[0.2em] uppercase border cursor-pointer bg-transparent flex items-center justify-center gap-2.5 transition-colors duration-200",
            isWished
              ? "border-wine text-wine"
              : "border-line text-ink hover:border-ink",
          )}
        >
          <HeartIcon size={16} filled={isWished} />
          {isWished ? "Saved to wishlist" : "Add to wishlist"}
        </button>
      </div>

      {/* Every garment on this site can be cut to measure, and a sold-out size
          is the moment that is worth saying. */}
      <div className="mt-[clamp(18px,2.2vw,24px)] bg-panel px-5 py-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="m-0 text-[14px] leading-[1.6] text-cocoa max-w-[38ch]">
          {soldOut
            ? "Gone from the rail — but this design can still be stitched to your own measurements."
            : "Prefer it in your own measurements? Silai stitches this design to order."}
        </p>
        <Link
          href="/silai"
          className="text-[12px] tracking-[0.18em] uppercase text-gold-dark hover:text-ink border-b border-current pb-0.5"
        >
          Silai →
        </Link>
      </div>

      {/* ---- Details, description, size guide ------------------------------ */}
      <div ref={tabsRef} className="mt-[clamp(26px,3vw,38px)] scroll-mt-6">
        <div role="tablist" className="flex flex-wrap gap-x-6 border-b border-line">
          {TABS.map((name) => (
            <button
              key={name}
              role="tab"
              type="button"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={cn(
                "-mb-px bg-transparent border-0 border-b-2 px-0 pb-2.5 pt-1 text-[12.5px] tracking-[0.18em] uppercase cursor-pointer transition-colors duration-200",
                tab === name
                  ? "border-ink text-ink"
                  : "border-transparent text-muted hover:text-ink",
              )}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="pt-5 text-[15px] leading-[1.75] text-cocoa">
          {tab === "Details" && (
            <div className="flex flex-col gap-4">
              {detail.components.map((component) => (
                <div key={component.name}>
                  <div className="text-ink">{component.name}</div>
                  <div>Colour: {component.colour}</div>
                  <div>Fabric: {component.fabric}</div>
                </div>
              ))}
              <div>
                <div>
                  {product.pieces} piece{product.pieces > 1 ? "s" : ""}
                  {product.withDupatta ? ", dupatta included" : ""}
                </div>
                <div>{detail.care}</div>
              </div>
              <p className="m-0 text-[12.5px] tracking-[0.06em] uppercase text-muted">
                {COLOUR_NOTE}
              </p>
            </div>
          )}

          {tab === "Description" && (
            <div className="flex flex-col gap-4">
              <p className="m-0">{detail.description}</p>
              <p className="m-0">
                Cut and finished in our own studio in Karachi, and dispatched
                within 48 hours. Free delivery over Rs 5,000.
              </p>
            </div>
          )}

          {tab === "Size Guide" && (
            <div className="flex flex-col gap-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[14px]">
                  <thead>
                    <tr>
                      {sizeGuide.columns.map((column) => (
                        <th
                          key={column}
                          scope="col"
                          className="border-b border-line py-2 pr-4 text-left font-normal text-[12px] tracking-[0.14em] uppercase text-muted"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeGuide.rows.map((row) => (
                      <tr
                        key={row[0]}
                        className={cn(
                          row[0] === size && "bg-panel text-ink",
                        )}
                      >
                        {row.map((cell, i) => (
                          <td
                            key={`${row[0]}-${sizeGuide.columns[i]}`}
                            className={cn(
                              "border-b border-line py-2 pr-4 tabular-nums",
                              i === 0 && "tracking-[0.14em] uppercase",
                            )}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="m-0 text-[12.5px] text-muted">
                All measurements in inches.
              </p>
              <ul className="m-0 pl-4 flex flex-col gap-2">
                {sizeGuide.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-[clamp(24px,3vw,34px)] border-t border-line pt-5">
        <ShareRow url={url} name={product.name} />
      </div>
    </div>
  );
}
