import Image from "next/image";
import type { ShopPage } from "@/content/collections";
import { img } from "@/lib/assets";
import { cn } from "@/lib/utils";

/**
 * The band that closes a shop page: a frame from the line beside the three or
 * four things a shopper actually needs to know before ordering it — how the
 * cloth behaves, how the sizing runs, what a sale price does to the returns
 * policy. The copy is per page, in `content/collections.ts`.
 */
export function CollectionNote({ page }: { page: ShopPage }) {
  return (
    <section className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(44px,7vw,90px)]">
      <div className="flex flex-wrap bg-panel">
        <div className="flex-[1_1_320px] min-h-[320px] relative overflow-hidden">
          <Image
            src={img(page.banner)}
            alt={`${page.title} at FEEZEE`}
            fill
            sizes="(max-width: 860px) 100vw, 620px"
            className="object-cover object-top"
          />
        </div>

        <div className="flex-[1_1_340px] p-[clamp(24px,4.4vw,60px)] flex flex-col justify-center gap-4">
          <div
            className={cn(
              "text-[13px] tracking-[0.32em] uppercase",
              page.tone === "sale" ? "text-wine" : "text-gold",
            )}
          >
            {page.title}
          </div>
          <h2 className="font-display font-normal text-[clamp(24px,3.4vw,38px)] leading-[1.15] m-0 text-pretty">
            {page.note.title}
          </h2>
          <p className="m-0 text-[15.5px] leading-[1.7] text-cocoa max-w-[48ch]">
            {page.note.body}
          </p>

          <ul className="m-0 mt-1 p-0 list-none flex flex-col gap-2.5">
            {page.note.points.map((point) => (
              <li
                key={point}
                className="flex gap-3 text-[14.5px] leading-[1.5] text-ink"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-[9px] h-px w-3.5 shrink-0",
                    page.tone === "sale" ? "bg-wine" : "bg-gold",
                  )}
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
