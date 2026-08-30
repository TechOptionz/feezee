import Image from "next/image";
import Link from "next/link";
import { linePages, productsForPage } from "@/content/collections";
import { img } from "@/lib/assets";

/**
 * The three lines New In is made of, as three doors. It sits under the New In
 * grid to answer the question that grid raises — everything is here, so what
 * are the parts? — and on the sale page as the way back to full price.
 */
export function LineStrip({
  heading = "Shop the lines",
  standfirst,
}: {
  heading?: string;
  standfirst?: string;
}) {
  return (
    <section className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(44px,7vw,90px)]">
      <h2 className="font-display font-normal text-[clamp(26px,3.6vw,40px)] leading-[1.1] m-0">
        {heading}
      </h2>
      {standfirst && (
        <p className="mt-3 mb-0 max-w-[60ch] text-[15px] leading-[1.7] text-cocoa">
          {standfirst}
        </p>
      )}

      <div className="mt-[clamp(22px,3vw,36px)] grid grid-cols-1 nav:grid-cols-3 gap-x-5 gap-y-8">
        {linePages.map((page) => (
          <Link key={page.slug} href={page.slug} className="group block">
            <div className="relative aspect-[4/5] overflow-hidden bg-sand">
              <Image
                src={img(page.banner)}
                alt=""
                fill
                sizes="(max-width: 860px) 100vw, 33vw"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </div>
            <div className="pt-4 flex flex-col gap-1.5">
              <div className="text-[13px] tracking-[0.2em] uppercase text-ink">
                {page.nav}
              </div>
              <div className="text-[12px] text-muted tracking-[0.06em]">
                {productsForPage(page).length} pieces · {page.eyebrow}
              </div>
              <span className="mt-1 self-start text-[12px] tracking-[0.14em] uppercase text-gold-dark border-b border-current pb-0.5 group-hover:text-ink">
                Shop the line →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
