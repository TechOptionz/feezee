"use client";

import { useState } from "react";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { ProductCard } from "@/components/ui/product-card";
import { ViewAll } from "@/components/ui/view-all";
import type { ArrivalGroup } from "@/modules/catalogue/collections";

/**
 * The drop, three tabs of four looks. The curation is editorial and comes from
 * `content/products.ts`; the garments themselves are resolved against live
 * stock on the server and handed down here, so a price shown on the home page
 * is the price the bag will charge.
 */
export function NewArrivals({ groups }: { groups: ArrivalGroup[] }) {
  const groupNames = groups.map((g) => g.name);
  const [active, setActive] = useState<string>(groups[0]?.name ?? "");
  const index = Math.max(0, groups.findIndex((g) => g.name === active));
  const group = groups[index];
  const looks = group?.products ?? [];

  if (!group) return null;

  return (
    <section id="new" className="pt-[clamp(48px,7.5vw,96px)]">
      {/* Same shape as "Shop by Category": copy on top, four looks beneath. */}
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px]">
        <p className="m-0 flex items-center gap-3 text-[12.5px] tracking-[0.3em] uppercase text-muted">
          <span
            className="h-px w-[clamp(22px,3vw,40px)] bg-gold/70"
            aria-hidden
          />
          {group.lineSize} pieces
        </p>

        {/*
          The heading and the filter share a row and sit on the same bottom
          edge, so the names read as a control hung off the title rather than
          words adrift in the whitespace beside it. Under the nav breakpoint
          the filter drops to its own full-width line.
        */}
        <div className="mt-[clamp(10px,1.4vw,16px)] flex flex-col nav:flex-row nav:items-end nav:justify-between gap-x-[clamp(32px,5vw,80px)] gap-y-[clamp(18px,2.4vw,28px)]">
          <h2 className="font-display font-normal text-[clamp(34px,5.2vw,58px)] leading-[1.05] m-0">
            New Arrivals
          </h2>
          <FilterTabs
            items={groupNames}
            active={group.name}
            onChange={setActive}
            label="Filter new arrivals"
            className="nav:shrink-0 -mx-[18px] px-[18px] nav:mx-0 nav:px-0"
          />
        </div>

        {/* Keyed on the group so the copy fades in with the looks it describes. */}
        <p
          key={group.name}
          className="fz-rise mt-[clamp(16px,2vw,24px)] mb-0 max-w-[62ch] text-[clamp(15px,1.05vw,16.5px)] leading-[1.7] text-cocoa"
        >
          {group.blurb}
        </p>
      </div>

      {/*
        The same tile block as "Shop by Category" above: full-bleed and four
        across from the nav breakpoint, and two in a gutter on a phone so the
        pair never share a seam. Keyed on the group so each switch replays the
        rise-in.
      */}
      <div
        key={group.name}
        className="fz-rise mt-[clamp(28px,3.6vw,48px)] grid grid-cols-2 nav:grid-cols-4 px-[18px] gap-x-[14px] gap-y-10 nav:px-0 nav:gap-x-0 nav:gap-y-9"
      >
        {looks.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            ratio="2/3"
            sizes="(max-width: 860px) 47vw, 25vw"
          />
        ))}
      </div>

      <div className="max-w-[var(--fz-container)] mx-auto px-[18px]">
        {/* Which line of the drop is on screen — the rule spans the looks and
            fills the segment belonging to the active group. */}
        <div
          className="relative mt-[clamp(22px,2.8vw,34px)] h-px bg-line"
          aria-hidden
        >
          <span
            className="absolute inset-y-0 left-0 bg-ink transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
            style={{
              width: `${100 / groups.length}%`,
              transform: `translateX(${index * 100}%)`,
            }}
          />
        </div>

        <div className="mt-[clamp(22px,2.8vw,32px)] text-center">
          <ViewAll href={group.href}>
            View all {group.name.toLowerCase()}
          </ViewAll>
        </div>
      </div>
    </section>
  );
}
