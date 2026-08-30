"use client";

import { cn } from "@/lib/utils";

/**
 * The filter row both shop sections carry under their heading. It reads as one
 * control rather than three loose words: the names sit on a shared hairline and
 * the active one thickens its own segment of it, so the rule doubles as the
 * indicator. Below the nav breakpoint the row scrolls sideways instead of
 * wrapping, which keeps the names on a single line at every width.
 */
export function FilterTabs({
  items,
  active,
  onChange,
  label,
  className,
}: {
  items: readonly string[];
  active: string;
  onChange: (name: string) => void;
  /** Names the group for screen readers, e.g. "Filter new arrivals". */
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex items-end no-scrollbar overflow-x-auto border-b border-line",
        "gap-x-[clamp(22px,2.8vw,44px)]",
        className,
      )}
    >
      {items.map((name) => {
        const selected = name === active;
        return (
          <button
            key={name}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(name)}
            className={cn(
              // -mb-px so the active segment covers the shared hairline
              // instead of stacking a second line on top of it.
              "relative -mb-px shrink-0 cursor-pointer whitespace-nowrap",
              /* The names are the control, so on a phone each one carries a
                 thumb's worth of height above and below its own word. */
              "pt-2.5 pb-3.5 nav:pt-1 nav:pb-[clamp(11px,1.1vw,15px)]",
              "text-[clamp(15px,1.15vw,18px)] tracking-[0.2em] uppercase",
              "transition-colors duration-200",
              "after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px]",
              "after:bg-current after:transition-[width] after:duration-300 after:ease-[cubic-bezier(0.22,0.61,0.36,1)]",
              selected
                ? "text-ink after:w-full"
                : "text-muted hover:text-ink after:w-0 hover:after:w-full focus-visible:text-ink focus-visible:after:w-full",
            )}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
