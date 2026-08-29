"use client";

import { Wordmark } from "@/components/ui/wordmark";
import { BagIcon, SearchIcon } from "@/components/ui/icons";
import { useStore } from "@/components/store/store-provider";
import { primaryNav } from "@/content/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const { bagCount, menuOpen, toggleMenu } = useStore();

  return (
    <header className="sticky top-0 z-50 bg-cream/96 backdrop-blur-[8px] border-b border-line">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-[14px] py-3 max-w-[var(--fz-container)] mx-auto">
        <div className="flex justify-start">
          <button
            type="button"
            onClick={toggleMenu}
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            className="nav:hidden bg-transparent border-none p-1.5 cursor-pointer flex flex-col gap-[5px] min-w-11 min-h-11 justify-center"
          >
            <span className="block w-[22px] h-[1.5px] bg-ink" />
            <span className="block w-[22px] h-[1.5px] bg-ink" />
            <span className="block w-[14px] h-[1.5px] bg-ink" />
          </button>
        </div>

        <a href="#top" className="text-center text-ink hover:text-ink">
          <Wordmark variant="header" />
        </a>

        <div className="flex items-center justify-end">
          <button
            type="button"
            aria-label="Search"
            className="hidden nav:block bg-transparent border-none cursor-pointer p-2.5 text-ink"
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            aria-label="Bag"
            className="bg-transparent border-none cursor-pointer p-2.5 relative min-w-11 min-h-11 text-ink flex items-center justify-center"
          >
            <BagIcon />
            {bagCount > 0 && (
              <span className="absolute top-1 right-0.5 bg-wine text-white text-[10px] min-w-4 h-4 rounded-lg flex items-center justify-center px-1">
                {bagCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <nav className="hidden nav:flex justify-center gap-[34px] px-[18px] pb-[13px] text-[13px] tracking-[0.16em] uppercase">
        {primaryNav.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={cn(
              link.tone === "sale" ? "text-wine hover:text-wine" : "text-ink hover:text-ink",
            )}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
