"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { img } from "@/lib/assets";
import { heroSlides, HERO_SLIDE_MS } from "@/content/hero";
import { cn } from "@/lib/utils";

export function Hero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [motion, setMotion] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * A hero that moves on its own is decoration, not content: when the visitor
   * asks for reduced motion we render the first look and stop there — no
   * auto-advance, no Ken Burns, no crossfade.
   */
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotion(!query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const go = useCallback((next: number) => {
    setIndex(((next % heroSlides.length) + heroSlides.length) % heroSlides.length);
  }, []);

  /*
   * setTimeout keyed on `index` rather than a single setInterval: a manual
   * jump to a slide then restarts the full dwell time instead of inheriting
   * whatever was left of the previous tick.
   */
  useEffect(() => {
    if (!motion || paused) return;
    timer.current = setTimeout(() => go(index + 1), HERO_SLIDE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, motion, paused, go]);

  /* Background tabs should not burn through the deck while nobody is looking. */
  useEffect(() => {
    const sync = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const slide = heroSlides[index];

  return (
    <section
      id="top"
      aria-roledescription="carousel"
      aria-label="Featured looks"
      /*
       * The section carries the photographs' own 1672:941 ratio, so `cover`
       * has nothing to crop: on any normal window the full frame is visible,
       * heads included. Only an unusually short window trims it, and the
       * per-slide `focus` keeps that trim off the faces.
       */
      className="relative w-full aspect-[1672/941] max-h-[100svh] min-h-[520px] overflow-hidden bg-ink"
    >
      {heroSlides.map((s, i) => {
        const active = i === index;
        return (
          <div
            key={s.file}
            aria-hidden={!active}
            className={cn(
              "absolute inset-0 transition-opacity duration-[300ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
              active ? "opacity-100" : "opacity-0",
            )}
          >
            <Image
              /*
               * Remounting the <div> would re-request the image, so the zoom
               * is keyed instead: the class is only applied while the slide is
               * on screen, and the key restart replays it from frame one.
               */
              key={active ? `${s.file}-on` : `${s.file}-off`}
              src={img(`hero/${s.file}`)}
              alt={s.alt}
              fill
              /* Only the opening look is the LCP candidate; the rest load lazily. */
              preload={i === 0}
              sizes="100vw"
              style={{
                objectPosition: s.focus,
                /* Outlast the dwell so the zoom never freezes mid-crossfade. */
                animationDuration: `${HERO_SLIDE_MS + 700}ms`,
              }}
              className={cn(
                "object-cover",
                motion && active && (s.drift === "left" ? "fz-zoom-left" : "fz-zoom-right"),
              )}
            />
          </div>
        );
      })}

      {/* Two stops: a soft top veil for the header, a deep foot for the copy. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(43,33,24,0.18)_0%,rgba(43,33,24,0)_30%,rgba(43,33,24,0.30)_66%,rgba(43,33,24,0.82)_100%)]" />

      <div className="absolute left-0 right-0 bottom-0 px-[clamp(16px,2.2vw,34px)] pb-[clamp(46px,7vh,84px)] text-cream">
        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[12px] sm:text-[14px] tracking-[0.28em] sm:tracking-[0.34em] uppercase text-champagne mb-3">
          <span>Festive &apos;26 Collection</span>
          <span className="h-px w-8 bg-champagne/45" aria-hidden />
          <span key={slide.caption} className="fz-rise text-cream/85">
            {slide.caption}
          </span>
        </div>
        <h1 className="font-display font-normal text-[clamp(40px,7vw,86px)] leading-[1.04] m-0 mb-[22px] max-w-[15ch] text-pretty">
          Elegance, stitched the Pakistani way
        </h1>
        <div className="flex gap-3 flex-wrap">
          <a
            href="#new"
            className="inline-block bg-cream text-ink hover:text-ink px-[clamp(30px,3vw,42px)] py-4 text-[15px] tracking-[0.18em] uppercase transition-transform duration-300 hover:-translate-y-0.5"
          >
            Shop New In
          </a>
          <a
            href="#silai"
            className="inline-block border border-cream/70 text-cream hover:text-cream px-[clamp(30px,3vw,42px)] py-4 text-[15px] tracking-[0.18em] uppercase transition-colors duration-300 hover:bg-cream/10"
          >
            Made to Order
          </a>
        </div>

        {/* Progress rails double as the slide picker. */}
        {/*
         * The pause lives here rather than on the <section>: the hero is
         * full-bleed, so a cursor resting anywhere over the photograph would
         * otherwise hold the deck still indefinitely. Hovering or tabbing into
         * the picker is the moment a visitor actually wants it to wait.
         */}
        <div
          className="mt-9 flex gap-2.5"
          role="group"
          aria-label="Choose a look"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {heroSlides.map((s, i) => (
            <button
              key={s.file}
              type="button"
              aria-label={s.caption}
              aria-current={i === index}
              onClick={() => go(i)}
              className="group h-4 w-9 sm:w-12 cursor-pointer bg-transparent p-0 border-0"
            >
              <span className="relative block h-[2px] w-full bg-cream/30 overflow-hidden transition-colors group-hover:bg-cream/55">
                <span
                  key={`${s.file}-${index}`}
                  style={{ animationDuration: `${HERO_SLIDE_MS}ms` }}
                  className={cn(
                    "absolute inset-y-0 left-0 bg-champagne",
                    i === index && motion && "fz-rail",
                    i === index && paused && "[animation-play-state:paused]",
                    i === index && !motion && "w-full",
                    i !== index && "w-0",
                  )}
                />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
