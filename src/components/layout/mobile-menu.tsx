"use client";

import { useEffect, useRef } from "react";
import { Logo } from "@/components/ui/logo";
import { useStore } from "@/components/store/store-provider";
import { primaryNav } from "@/content/navigation";
import { cn } from "@/lib/utils";

const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

export function MobileMenu() {
  const { menuOpen, closeMenu } = useStore();
  const panelRef = useRef<HTMLDivElement>(null);

  /*
   * A drawer that covers the page has to behave like a dialog: Escape closes
   * it, Tab stays inside it, and the page behind it does not scroll. Without
   * the scroll lock the body scrolls under the overlay on touch devices.
   */
  useEffect(() => {
    if (!menuOpen) return;

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      // Wrap focus at either end so Tab never escapes to the page behind.
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [menuOpen, closeMenu]);

  if (!menuOpen) return null;

  const last = primaryNav.length - 1;

  return (
    <>
      <div onClick={closeMenu} className="fixed inset-0 bg-ink/45 z-90" aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="fixed top-0 left-0 bottom-0 w-[78%] max-w-[320px] bg-cream z-100 px-[26px] py-7 flex flex-col gap-1 shadow-[8px_0_40px_rgba(43,33,24,0.25)]"
      >
        <div className="flex items-start justify-between mb-[18px]">
          <Logo className="h-[34px]" />
          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close menu"
            className="-mt-1 -mr-2 bg-transparent border-none cursor-pointer p-2 text-xl leading-none text-ink"
          >
            &times;
          </button>
        </div>

        {primaryNav.map((link, i) => (
          <a
            key={link.label}
            href={link.href}
            onClick={closeMenu}
            className={cn(
              "text-base tracking-[0.1em] uppercase py-3",
              i < last && "border-b border-line",
              link.tone === "sale" ? "text-wine hover:text-wine" : "text-ink hover:text-ink",
            )}
          >
            {link.label}
          </a>
        ))}

        <div className="mt-auto text-xs text-muted tracking-[0.08em]">
          WhatsApp orders · Cash on delivery
        </div>
      </div>
    </>
  );
}
