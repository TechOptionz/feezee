"use client";

import { Wordmark } from "@/components/ui/wordmark";
import { useStore } from "@/components/store/store-provider";
import { primaryNav } from "@/content/navigation";
import { cn } from "@/lib/utils";

export function MobileMenu() {
  const { menuOpen, closeMenu } = useStore();

  if (!menuOpen) return null;

  const last = primaryNav.length - 1;

  return (
    <>
      <div
        onClick={closeMenu}
        className="fixed inset-0 bg-ink/45 z-90"
        aria-hidden="true"
      />
      <div className="fixed top-0 left-0 bottom-0 w-[78%] max-w-[320px] bg-cream z-100 px-[26px] py-7 flex flex-col gap-1 shadow-[8px_0_40px_rgba(43,33,24,0.25)]">
        <Wordmark variant="drawer" className="mb-[18px]" />

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
