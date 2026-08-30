"use client";

import Link from "next/link";
import { useRef } from "react";
import { Logo } from "@/components/ui/logo";
import { useStore } from "@/components/store/store-provider";
import { HeartIcon } from "@/components/ui/icons";
import { primaryNav } from "@/content/navigation";
import { contact, whatsappHref } from "@/lib/site";
import { useOverlay } from "@/lib/use-overlay";
import { cn } from "@/lib/utils";

export function MobileMenu() {
  const { menuOpen, closeMenu, wishCount, hydrated } = useStore();
  const panelRef = useRef<HTMLDivElement>(null);

  // A drawer that covers the page has to behave like a dialog — see useOverlay.
  useOverlay(menuOpen, panelRef, closeMenu);

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
        className="fixed top-0 left-0 bottom-0 w-[78%] max-w-[320px] bg-cream z-100 px-[26px] py-7 flex flex-col gap-1 shadow-[8px_0_40px_rgba(43,33,24,0.25)] overflow-y-auto"
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
          <Link
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
          </Link>
        ))}

        {/* Search is hidden at this width, so the wishlist gets a line of its
            own here rather than disappearing with it. */}
        <Link
          href="/wishlist"
          onClick={closeMenu}
          className="mt-4 flex items-center gap-2.5 border-t border-line pt-4 text-[14px] tracking-[0.14em] uppercase text-ink hover:text-ink"
        >
          <HeartIcon size={18} filled={hydrated && wishCount > 0} />
          Wishlist
          {hydrated && wishCount > 0 && (
            <span className="text-wine">({wishCount})</span>
          )}
        </Link>

        <div className="mt-auto flex flex-col gap-1.5 pt-6 text-[13px] text-muted tracking-[0.08em]">
          <a
            href={whatsappHref()}
            target="_blank"
            rel="noreferrer"
            className="text-ink hover:text-ink"
          >
            WhatsApp {contact.whatsapp.display}
          </a>
          <span>WhatsApp orders · Cash on delivery</span>
        </div>
      </div>
    </>
  );
}
