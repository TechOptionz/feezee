"use client";

import { useState } from "react";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { ProductCard } from "@/components/ui/product-card";
import { ViewAll } from "@/components/ui/view-all";
import { categoryTabs, productsByIds } from "@/content/products";

const tabNames = categoryTabs.map((t) => t.name);

export function Categories() {
  const [active, setActive] = useState(categoryTabs[0].name);
  const tab = categoryTabs.find((t) => t.name === active) ?? categoryTabs[0];
  const looks = productsByIds(tab.productIds);

  return (
    <section id="categories" className="pt-[clamp(44px,7vw,88px)]">
      {/* Header stays on the container grid; the tiles below run full-bleed.
          Heading and filter share a bottom edge — see FilterTabs. */}
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px] mb-[clamp(28px,3.6vw,48px)] flex flex-col nav:flex-row nav:items-end nav:justify-between gap-x-[clamp(32px,5vw,80px)] gap-y-[clamp(18px,2.4vw,28px)]">
        <h2 className="font-display font-normal text-[clamp(34px,5.2vw,58px)] leading-[1.05] m-0">
          Shop by Category
        </h2>
        <FilterTabs
          items={tabNames}
          active={tab.name}
          onChange={setActive}
          label="Filter by category"
          className="nav:shrink-0 -mx-[18px] px-[18px] nav:mx-0 nav:px-0"
        />
      </div>
      {/*
        Keyed on the tab so each switch replays the rise-in rather than snapping.

        From `nav` up the photographs run edge to edge and only the rows are
        spaced — four across, the way the design draws it. Two across on a
        phone that seam does not work: the two cards meet with nothing between
        them, so the left card's heart sits a few pixels from the right card's
        badge and the captions of the pair very nearly touch. Below `nav` the
        block takes the page margin and a column gutter, which puts each card
        in a frame of its own and keeps every control clear of the screen edge.
      */}
      <div
        key={tab.name}
        className="fz-rise grid grid-cols-2 nav:grid-cols-4 px-[18px] gap-x-[14px] gap-y-10 nav:px-0 nav:gap-x-0 nav:gap-y-9"
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

      <div className="max-w-[var(--fz-container)] mx-auto px-[18px] mt-[clamp(24px,3vw,36px)] text-center">
        <ViewAll href={tab.href}>View all {tab.name.toLowerCase()}</ViewAll>
      </div>
    </section>
  );
}
