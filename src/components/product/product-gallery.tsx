"use client";

import Image from "next/image";
import type { KeyboardEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { img } from "@/lib/assets";
import { cn } from "@/lib/utils";

/**
 * Every photograph of one garment.
 *
 * It is one list of images in the DOM, laid out two ways by CSS: a grid beside
 * the buying panel on a desktop, and a full-bleed swipe rail on a phone. Both
 * come out of the same markup and the same `sizes`, so switching between them
 * is a reflow rather than a second set of downloads — and the server render is
 * already correct at either width.
 */
export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  /** The garment's name; each frame is numbered off it for screen readers. */
  alt: string;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  /* Which frame the swipe rail has landed on. Rounded off the rail's own
     width, so it is right whatever the phone is. Above the breakpoint the
     rail is a grid and cannot scroll, so this never fires there. */
  const sync = useCallback(() => {
    const el = rail.current;
    if (!el || el.clientWidth === 0) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  /*
   * Move the rail to a frame. Scrolling rather than setting state is what keeps
   * the arrows, the thumbnails and a swipe of the thumb telling the same story:
   * every one of them ends at `onScroll`, and `active` only ever describes where
   * the rail actually is.
   */
  const go = useCallback(
    (index: number) => {
      const el = rail.current;
      if (!el || el.clientWidth === 0) return;
      const next = Math.min(Math.max(index, 0), images.length - 1);
      el.scrollTo({
        left: next * el.clientWidth,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    },
    [images.length],
  );

  /* The rail is a scroll region, so a keyboard lands on it; left and right step
     it a whole frame at a time instead of the browser's few pixels. */
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      go(active + (event.key === "ArrowRight" ? 1 : -1));
    },
    [active, go],
  );

  /*
   * Two frames abreast only once there are enough of them to fill the column
   * beside a buying panel that is a thousand pixels tall. Below four, a pair of
   * half-width pictures ends halfway up the page and leaves the rest of the
   * left-hand side empty — so the frames run full width instead, and the panel
   * pins itself while they scroll past.
   */
  const abreast = images.length >= 4;
  const many = images.length > 1;

  return (
    <div>
      <div className="relative">
        <div
          ref={rail}
          onScroll={sync}
          onKeyDown={onKeyDown}
          tabIndex={many ? 0 : undefined}
          role={many ? "group" : undefined}
          aria-label={many ? `${alt} — photographs` : undefined}
          className={cn(
            "no-scrollbar flex overflow-x-auto snap-x snap-mandatory outline-none",
            "nav:grid nav:gap-[6px] nav:overflow-visible",
            abreast ? "nav:grid-cols-2" : "nav:grid-cols-1",
          )}
        >
          {images.map((file, i) => (
            <div
              key={file}
              className="relative w-full shrink-0 snap-start aspect-[3/4] bg-sand nav:w-auto nav:shrink"
            >
              <Image
                src={img(file)}
                alt={`${alt} — view ${i + 1} of ${images.length}`}
                fill
                /* The first frame is the largest thing on the page and the
                   thing being waited for, so it is fetched ahead of the rest. */
                priority={i === 0}
                sizes={
                  abreast
                    ? "(max-width: 860px) 100vw, 34vw"
                    : "(max-width: 860px) 100vw, 62vw"
                }
                className="object-cover object-top"
              />
            </div>
          ))}
        </div>

        {/* Step controls, for the swipe layout only — a grid is already showing
            you the frame the arrow would take you to. */}
        {many && (
          <>
            <StepButton
              direction="left"
              disabled={active === 0}
              onClick={() => go(active - 1)}
            />
            <StepButton
              direction="right"
              disabled={active === images.length - 1}
              onClick={() => go(active + 1)}
            />
          </>
        )}
      </div>

      {/* How many photographs there are, and which one you are on — said with
          the photographs themselves, so the count is also a way to reach any
          one of them directly. Swipe layout only, for the same reason. */}
      {many && (
        <div className="nav:hidden no-scrollbar mt-3 flex justify-center gap-2 overflow-x-auto px-[18px]">
          {images.map((file, i) => (
            <button
              key={file}
              type="button"
              onClick={() => go(i)}
              aria-label={`View ${i + 1} of ${images.length}`}
              aria-current={i === active}
              className={cn(
                "relative w-12 shrink-0 aspect-[3/4] bg-sand cursor-pointer transition duration-200",
                "outline-offset-2 outline-ink focus-visible:outline-1",
                i === active
                  ? "ring-1 ring-ink opacity-100"
                  : "opacity-55 hover:opacity-85",
              )}
            >
              <Image
                src={img(file)}
                alt=""
                fill
                sizes="48px"
                className="object-cover object-top"
              />
            </button>
          ))}
          <span className="sr-only" aria-live="polite">
            {`View ${active + 1} of ${images.length}`}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * One end of the swipe rail, sitting on a photograph: filled and shadowed so it
 * reads against embroidery as well as against a plain studio wall.
 *
 * A spent arrow fades out but keeps its place, so the live one never moves
 * under the thumb mid-scroll, and the frame beneath it stays tappable. The pair
 * is out of the tab order — the rail itself takes the focus, and the arrow keys
 * do there what these two do here.
 */
function StepButton({
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
      aria-hidden
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "nav:hidden absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border",
        "flex items-center justify-center transition duration-200",
        direction === "left" ? "left-3" : "right-3",
        disabled
          ? "pointer-events-none opacity-0"
          : "pointer-events-auto cursor-pointer bg-cream/90 border-line/70 text-ink shadow-[0_2px_14px_rgba(31,24,18,0.16)] backdrop-blur-sm active:bg-ink active:text-cream",
      )}
    >
      <ArrowIcon direction={direction} size={16} />
    </button>
  );
}
