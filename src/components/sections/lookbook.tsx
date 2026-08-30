"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { ProductCard } from "@/components/ui/product-card";
import { boutiqueLooks } from "@/content/products";
import { cn } from "@/lib/utils";

const looks = boutiqueLooks();

/**
 * The boutique rail: the pieces hanging in the shop, each one carrying its own
 * name and price so the section sells rather than only decorates.
 *
 * It is a scroll container first and a carousel second — a drag or a trackpad
 * flick has always worked, and the arrows are there for the pointer that has
 * neither. Every press moves by whole cards, so a photograph is never left half
 * in frame.
 */
export function Lookbook() {
  const rail = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /*
   * Where the rail is headed, while a smooth scroll is still running. A second
   * press has to count from there rather than from where the rail happens to
   * be: a new smooth scroll starts from the current position, so three quick
   * presses would otherwise land one page along instead of three.
   */
  const queued = useRef<number | null>(null);
  const forget = useRef<number | undefined>(undefined);

  /* Which arrows are live. The one-pixel slack absorbs fractional scroll
     positions, which a zoomed page and a snap landing both produce. */
  const sync = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    sync();

    /* A resize changes how many cards fit, and with it whether the rail can
       still be scrolled at all — the arrows have to be told. */
    const observer = new ResizeObserver(sync);
    observer.observe(el);

    /* A drag or a flick makes the queued destination a lie. */
    const drop = () => {
      queued.current = null;
    };
    el.addEventListener("pointerdown", drop);
    el.addEventListener("wheel", drop, { passive: true });
    el.addEventListener("touchstart", drop, { passive: true });

    return () => {
      observer.disconnect();
      el.removeEventListener("pointerdown", drop);
      el.removeEventListener("wheel", drop);
      el.removeEventListener("touchstart", drop);
      window.clearTimeout(forget.current);
    };
  }, [sync]);

  /** Move one screenful of whole cards, in the direction given. */
  const page = useCallback((direction: -1 | 1) => {
    const el = rail.current;
    if (!el) return;
    /* Measured off a card rather than off the first child, which is the
       spacer holding the opening gutter. */
    const card = el.querySelector<HTMLElement>("[data-rail-card]");
    if (!card) return;

    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = card.offsetWidth + gap;
    const perPage = Math.max(1, Math.floor((el.clientWidth + gap) / step));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const from = queued.current ?? el.scrollLeft;
    const target = Math.max(
      0,
      Math.min(el.scrollWidth - el.clientWidth, from + direction * step * perPage),
    );

    queued.current = target;
    el.scrollTo({ left: target, behavior: reduced ? "auto" : "smooth" });

    /* Snapping can land a pixel or two off the destination, so the queue is
       dropped on a timer rather than on arrival — well after the scroll has
       finished, and restarted by every further press. */
    window.clearTimeout(forget.current);
    forget.current = window.setTimeout(() => {
      queued.current = null;
    }, 900);
  }, []);

  /* With the rail focused, ← and → drive it the distance the buttons do,
     rather than the browser's own few-pixel nudge. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    page(event.key === "ArrowRight" ? 1 : -1);
  };

  return (
    <section id="boutique" className="pt-[clamp(48px,7.5vw,96px)]">
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px]">
        <p className="m-0 flex items-center gap-3 text-[12.5px] tracking-[0.3em] uppercase text-muted">
          <span className="h-px w-[clamp(22px,3vw,40px)] bg-gold/70" aria-hidden />
          @feezee.fashion
        </p>

        {/* The controls are not up here beside the heading: on a wide window
            that puts them a paragraph away from the photographs they move, and
            they go unnoticed. They sit on the rail itself instead. */}
        <h2 className="mt-[clamp(10px,1.4vw,16px)] font-display font-normal text-[clamp(34px,5.2vw,58px)] leading-[1.05] m-0">
          From the Boutique
        </h2>

        <p className="mt-[clamp(16px,2vw,24px)] mb-0 max-w-[62ch] text-[clamp(15px,1.05vw,16.5px)] leading-[1.7] text-cocoa">
          What is on the rail at the shop this week, photographed as it hangs —
          tag on, hem to the floor. Every piece here is stitched in the same
          studio, and can be cut to your measurements.
        </p>
      </div>

      {/*
        The rail runs the full width of the page: it opens on the page's own
        left margin rather than the container's, so no band of cream is left
        sitting beside the first card, and the last card bleeds off the right
        edge to say there is more of it.

        That margin is held by a spacer at each end rather than by padding on
        the rail: a percentage padding here leaves Chrome without a definite
        width for the cards, and every photograph inside them collapses to
        nothing. The spacers are a gap narrower than the margin, because the
        rail's own gap sits between each of them and the card beside it.
      */}
      <div className="relative mt-[clamp(28px,3.6vw,48px)]">
        <div
          ref={rail}
          role="region"
          aria-label="Garments on the rail at the boutique"
          tabIndex={0}
          onScroll={sync}
          onKeyDown={onKeyDown}
          className="no-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-[18px] pb-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          <RailGutter />

          {looks.map(({ product, img }) => (
            <div
              key={product.id}
              data-rail-card
              className="snap-start shrink-0 w-[clamp(212px,23vw,300px)]"
            >
              <ProductCard
                product={product}
                image={img}
                ratio="3/4"
                focus="center"
                sizes="(max-width: 860px) 62vw, 300px"
              />
            </div>
          ))}

          <RailGutter />
        </div>

        {/*
          The arrows, laid over the photographs they scroll. The strip is only
          as tall as a card's image — the same 3:4 the cards are cut to — so the
          pair lands on the middle of a garment rather than down among the names
          and prices. It takes no pointer events of its own, so a drag through
          the gap between the buttons still moves the rail.

          The z-index is not decoration: a card lays its own link over its
          photograph and its heart and bag controls above that, and none of the
          rail's wrappers open a stacking context to keep them local. Without a
          layer of its own the strip sits under that link, and every press of an
          arrow opens the garment behind it instead of scrolling.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[calc(clamp(212px,23vw,300px)*4/3)] flex items-center justify-between px-[10px]"
        >
          <RailButton direction="left" disabled={atStart} onClick={() => page(-1)} />
          <RailButton direction="right" disabled={atEnd} onClick={() => page(1)} />
        </div>
      </div>
    </section>
  );
}

/** The empty column at each end of the rail that holds the page margin. */
function RailGutter() {
  return <div aria-hidden className="shrink-0 w-[2px]" />;
}

/**
 * One end of the rail control, sitting on a photograph: filled and shadowed so
 * it reads against embroidery as well as against a plain studio wall.
 *
 * A spent arrow fades out but keeps its place, so the live one never shifts
 * under the pointer mid-scroll. It drops its pointer events as it goes, which
 * leaves the card beneath it clickable at either end of the rail.
 *
 * `aria-hidden` on the strip above keeps the pair out of the reading order:
 * the rail is a labelled scroll region, and the arrow keys drive it.
 */
function RailButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Previous garments" : "Next garments"}
      className={cn(
        "w-11 h-11 rounded-full border flex items-center justify-center transition duration-200",
        disabled
          ? "pointer-events-none opacity-0"
          : "pointer-events-auto cursor-pointer bg-cream/90 border-line/70 text-ink shadow-[0_2px_14px_rgba(31,24,18,0.16)] backdrop-blur-sm hover:bg-ink hover:text-cream hover:border-ink",
      )}
    >
      <ArrowIcon direction={direction} />
    </button>
  );
}
