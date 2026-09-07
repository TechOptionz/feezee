"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Logo } from "@/components/ui/logo";
import { AccountIcon, BagIcon, HeartIcon, SearchIcon } from "@/components/ui/icons";
import { useStore } from "@/components/store/store-provider";
import { primaryNav } from "@/content/navigation";
import { cn } from "@/lib/utils";

/**
 * `overHero` is the home page, where the header floats on the photograph. Every
 * other page has no hero to float over, so the header takes its place in the
 * flow: cream, solid, and scrolling away with the rest of the page.
 */
export function Header({ overHero = false }: { overHero?: boolean }) {
  const { bagCount, wishCount, hydrated, menuOpen, toggleMenu, openCart } =
    useStore();
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  /*
   * The header floats over the full-bleed hero, so it has two skins: light
   * type on the photograph while the hero is behind it, cream-and-ink once the
   * page moves — which is also when a cream panel stops covering the picture.
   */
  useEffect(() => {
    if (!overHero) return;
    const sync = () => setScrolled(window.scrollY > 24);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, [overHero]);

  const overlay = overHero && !scrolled;

  return (
    <header
      className={cn(
        "z-50 transition-colors duration-500",
        overHero
          ? "fixed inset-x-0 top-0"
          : "relative bg-cream border-b border-line",
        overHero &&
          (scrolled
            ? "bg-cream/96 backdrop-blur-[8px] border-b border-line"
            : "bg-[linear-gradient(180deg,rgba(43,33,24,0.52)_0%,rgba(43,33,24,0.18)_62%,rgba(43,33,24,0)_100%)]"),
      )}
    >
      <AnnouncementBar overlay={overlay} />

      {/*
       * One wrapping row. Wide enough, and the nav sits inline with the lockup
       * on a single line; below `wide` it is ordered last and made full-width,
       * so it wraps onto a row of its own exactly as it used to.
       *
       * Under `nav` there is no nav row underneath to supply the lower half of
       * the lockup's space, so the padding is equal top and bottom there. The
       * gaps close a notch too: on a 320px window the lockup, the menu and the
       * two counted icons came to a few pixels more than the line, and the
       * icons dropped to a second row of their own beneath it.
       */}
      <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 px-[clamp(16px,2.2vw,34px)] pt-3.5 pb-3.5 nav:pb-2 wide:pb-3.5">
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

        <Link href="/" aria-label="FEEZEE Fashion — home" className="block py-1">
          <Logo
            tone={overlay ? "light" : "gold"}
            priority
            className="h-[clamp(42px,5.6vw,72px)]"
          />
        </Link>

        {/*
         * Ordered after the nav so search, wishlist and bag close the single
         * line at the right gutter instead of sitting in against the lockup.
         * That hands their width back to the nav on the left, which carries the
         * two link groups — and the channel between them — clear of the model's
         * face. On the wrapped layout the nav is `order-last` on a row of its
         * own, so this only ever moves these past the nav, never past the
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

          {/*
            Always `/account`, never a link that depends on who is signed in.
            Reading the session here would mean reading a cookie in the header,
            and a cookie read makes every page that renders the header dynamic —
            which would cost the whole shop its static rendering for the sake of
            one icon. `/account` sends a guest to the sign-in page itself.
          */}
          <Link
            href="/account"
            aria-label="Your account"
            className="bg-transparent border-none cursor-pointer p-2.5 nav:p-3 relative min-w-11 min-h-11 text-inherit hover:text-inherit flex items-center justify-center"
          >
            <AccountIcon />
          </Link>

          {/* Beside search, and counted the same way as the bag. */}
          <Link
            href="/wishlist"
            aria-label={
              wishCount > 0 ? `Wishlist, ${wishCount} saved` : "Wishlist"
            }
            className="bg-transparent border-none cursor-pointer p-2.5 nav:p-3 relative min-w-11 min-h-11 text-inherit hover:text-inherit flex items-center justify-center"
          >
            <HeartIcon filled={hydrated && wishCount > 0} />
            {hydrated && wishCount > 0 && (
              <span className="absolute top-1.5 right-1 bg-wine text-white text-[12px] min-w-[18px] h-[18px] rounded-lg flex items-center justify-center px-1">
                {wishCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={openCart}
            aria-label={bagCount > 0 ? `Bag, ${bagCount} items` : "Bag"}
            className="bg-transparent border-none cursor-pointer p-2.5 nav:p-3 relative min-w-11 min-h-11 text-inherit flex items-center justify-center"
          >
            <BagIcon />
            {hydrated && bagCount > 0 && (
              <span className="absolute top-1.5 right-1 bg-wine text-white text-[12px] min-w-[18px] h-[18px] rounded-lg flex items-center justify-center px-1">
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
                  "gap-[clamp(16px,2.4vw,44px)] text-[clamp(15px,1.2vw,17px)]",
                  /* Inline with the lockup there is less line to spend, so the type
                   and the gaps tighten a step. */
                  "wide:gap-[clamp(14px,1.5vw,30px)] wide:text-[clamp(13px,0.9vw,15px)]",
                  side === 1 && "order-3",
                )}
              >
                {group.map((link) => {
                  // The page you are on keeps its rule drawn, so the bar says
                  // where you are without a second highlight colour.
                  const here = pathname === link.href;
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      aria-current={here ? "page" : undefined}
                      className={cn(
                        "fz-navlink whitespace-nowrap",
                        overlay && "fz-navlink--over",
                        here && "fz-navlink--here",
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
                    </Link>
                  );
                })}
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
