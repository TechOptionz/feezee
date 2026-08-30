import Image from "next/image";
import { silaiGallery } from "@/content/silai";
import { img } from "@/lib/assets";

/**
 * Pieces that have already left the table.
 *
 * It scrolls sideways at every width rather than becoming a grid on desktop:
 * a rack of finished orders has no end, and a rail says that where a tidy
 * two-by-four says the opposite. The caption names the cut, not the price —
 * nothing here is for sale as it stands, it is an example of a decision.
 */
export function SilaiGallery() {
  return (
    <section className="pt-[clamp(48px,8vw,100px)]">
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px]">
        <p className="m-0 flex items-center gap-3 text-[12.5px] tracking-[0.3em] uppercase text-muted">
          <span aria-hidden className="h-px w-[clamp(22px,3vw,40px)] bg-gold/70" />
          Off our table
        </p>
        <h2 className="mt-[clamp(8px,1.2vw,14px)] mb-0 font-display font-normal text-[clamp(26px,3.8vw,44px)] leading-[1.1] max-w-[20ch] text-pretty">
          Orders we have cut this season
        </h2>
        <p className="mt-3 mb-0 max-w-[58ch] text-[15px] leading-[1.7] text-cocoa">
          Every one of these started as a design on this site and a set of
          measurements on WhatsApp.
        </p>
      </div>

      {/*
        The rail scrolls inside the container rather than bleeding to the
        window edge: the first card then starts on the heading's vertical, and
        the card the container cuts in half is itself the hint that there is
        more to the right.
      */}
      <div className="max-w-[var(--fz-container)] mx-auto no-scrollbar mt-[clamp(22px,3vw,36px)] flex gap-[clamp(14px,1.4vw,18px)] overflow-x-auto px-[18px] pb-1 [scroll-padding-inline:18px] snap-x">
        {silaiGallery.map((look) => (
          <figure
            key={look.img}
            className="group m-0 w-[62vw] max-w-[270px] shrink-0 snap-start"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-sand">
              <Image
                src={img(look.img)}
                alt={look.caption}
                fill
                sizes="(max-width: 860px) 62vw, 270px"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </div>
            <figcaption className="pt-3 text-[13.5px] leading-[1.5] tracking-[0.04em] text-cocoa">
              {look.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
