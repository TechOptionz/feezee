"use client";

import { useEffect, useState } from "react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Logo } from "@/components/ui/logo";
import { BagIcon, SearchIcon } from "@/components/ui/icons";
import { useStore } from "@/components/store/store-provider";
import { primaryNav } from "@/content/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const { bagCount, menuOpen, toggleMenu } = useStore();
  const [solid, setSolid] = useState(false);

  /*
   * The header floats over the full-bleed hero, so it has two skins: light
   * type on the photograph while the hero is behind it, cream-and-ink once the
   * page moves — which is also when a cream panel stops covering the picture.
   */
  useEffect(() => {
    const sync = () => setSolid(window.scrollY > 24);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  const overlay = !solid;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        solid
          ? "bg-cream/96 backdrop-blur-[8px] border-b border-line"
          : "bg-[linear-gradient(180deg,rgba(43,33,24,0.52)_0%,rgba(43,33,24,0.18)_62%,rgba(43,33,24,0)_100%)]",
      )}
    >
      <AnnouncementBar overlay={overlay} />

      {/*
       * One wrapping row. Wide enough, and the nav sits inline with the lockup
       * on a single line; below `wide` it is ordered last and made full-width,
       * so it wraps onto a row of its own exactly as it used to.
       */}
      <div className="flex flex-wrap items-center gap-x-3 px-[clamp(16px,2.2vw,34px)] pt-3.5 pb-2 wide:pb-3.5">
        <button
          type="button"
          onClick={toggleMenu}
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
          className="nav:hidden bg-transparent border-none p-1.5 -ml-1.5 cursor-pointer flex flex-col gap-[5px] min-w-11 min-h-11 justify-center"
        >
          <span
            className={cn(
              "block w-[22px] h-[1.5px]",
              overlay ? "bg-cream" : "bg-ink",
            )}
          />
          <span
            className={cn(
              "block w-[22px] h-[1.5px]",
              overlay ? "bg-cream" : "bg-ink",
            )}
          />
          <span
            className={cn(
              "block w-[14px] h-[1.5px]",
              overlay ? "bg-cream" : "bg-ink",
            )}
          />
        </button>

        <a
          href="#top"
          aria-label="FEEZEE Fashion — home"
          className="block py-1"
        >
          <Logo
            tone={overlay ? "light" : "gold"}
            priority
            className="h-[clamp(42px,5.6vw,72px)]"
          />
        </a>

        {/*
         * Ordered after the nav so search and bag close the single line at the
         * right gutter instead of sitting in against the lockup. That hands
         * their width back to the nav on the left, which carries the two link
         * groups — and the channel between them — clear of the model's face.
         * On the wrapped layout the nav is `order-last` on a row of its own,
         * so this only ever moves these two past the nav, never past the
         * lockup, and `ml-auto` still holds them at the right.
         */}
        <div
          className={cn(
            "order-3 flex items-center gap-1 ml-auto",
            overlay ? "text-cream" : "text-ink",
          )}
        >
          <button
            type="button"
            aria-label="Search"
            className="hidden nav:block bg-transparent border-none cursor-pointer p-3 text-inherit"
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            aria-label="Bag"
            className="bg-transparent border-none cursor-pointer p-3 relative min-w-12 min-h-12 text-inherit flex items-center justify-center"
          >
            <BagIcon />
            {bagCount > 0 && (
              <span className="absolute top-1.5 right-1 bg-wine text-white text-[11px] min-w-[18px] h-[18px] rounded-lg flex items-center justify-center px-1">
                {bagCount}
              </span>
            )}
          </button>
        </div>

        {/*
         * Six links, split three-and-three around a reserved centre channel:
         * the model in every hero frame stands dead centre, so the middle of
         * the bar is left empty rather than run across her.
         *
         * The channel is a flex spacer rather than `justify-between`, which
         * pinned the groups to the gutters and left the bar looking hollow on a
         * wide window. Capped, it only ever grows to about the width of the
         * figure, and the surplus is split to the outside — so the two groups
         * sit in against her. On a narrow window the cap never binds, the
         * spacer collapses to its floor, and the groups spread to the gutters
         * exactly as before, because there the space is needed.
         */}
        <nav
          className={cn(
            "hidden nav:flex items-center justify-center",
            "order-last w-full px-[clamp(16px,2.2vw,34px)] pt-[18px] pb-[18px]",
            "wide:order-none wide:w-auto wide:flex-1 wide:px-0 wide:py-0",
          )}
        >
          {[primaryNav.slice(0, 3), primaryNav.slice(3, 6)].map(
            (group, side) => (
              <div
                key={side}
                className={cn(
                  "flex items-center tracking-[0.16em] uppercase",
                  "gap-[clamp(16px,2.4vw,44px)] text-[clamp(14px,1.2vw,17px)]",
                  /* Inline with the lockup there is less line to spend, so the type
                   and the gaps tighten a step. */
                  "wide:gap-[clamp(14px,1.5vw,30px)] wide:text-[clamp(12px,0.9vw,15px)]",
                  side === 1 && "order-3",
                )}
              >
                {group.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={cn(
                      "fz-navlink whitespace-nowrap",
                      overlay && "fz-navlink--over",
                      overlay
                        ? link.tone === "sale"
                          ? "text-champagne hover:text-champagne"
                          : "text-cream/90 hover:text-cream"
                        : link.tone === "sale"
                          ? "text-wine hover:text-wine"
                          : "text-ink hover:text-ink",
                    )}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ),
          )}
          <div
            aria-hidden
            className={cn(
              "order-2 flex-1 min-w-[clamp(28px,3vw,56px)] max-w-[clamp(200px,26vw,500px)]",
              /* Inline, the channel shares the line with the lockup and the
                 icons, so its cap comes down — otherwise it swallows the whole
                 surplus and pins the groups against them. */
              "wide:max-w-[clamp(140px,16vw,320px)]",
            )}
          />
        </nav>
      </div>
    </header>
  );
}
