import Image from "next/image";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { silaiBanner, silaiOrderHref } from "@/content/silai";
import { img } from "@/lib/assets";

/**
 * The top of the Silai page.
 *
 * The five shop pages open on cream, because a grid of garments follows and a
 * photograph would compete with it. Nothing follows this one but words, so it
 * opens on the picture instead — full-bleed, dark, with the crumb and the copy
 * laid over the foot of the frame the way the home hero does.
 */
export function SilaiBanner() {
  return (
    <section className="relative isolate min-h-[clamp(440px,72vh,680px)] flex flex-col justify-end overflow-hidden bg-ink">
      <Image
        src={img(silaiBanner.image)}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-top"
      />

      {/*
        Light at the top for the picture, deep at the foot for the type. The
        copy block starts around the midpoint on a phone, where it runs the
        full width of the frame, so the wash is already well under way by then.
      */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(43,33,24,0.50)_0%,rgba(43,33,24,0.22)_22%,rgba(43,33,24,0.60)_56%,rgba(43,33,24,0.92)_100%)]"
      />
      {/*
        The copy runs down the left half over a photograph that is lit in the
        middle, so a second wash comes in from that edge. It stops before the
        centre, which is where the garment is — the point of using a photograph
        at all is that you can still see what was stitched.
      */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(43,33,24,0.72)_0%,rgba(43,33,24,0.34)_38%,rgba(43,33,24,0)_66%)]"
      />

      <div className="relative max-w-[var(--fz-container)] w-full mx-auto px-[18px] pt-[clamp(60px,12vh,120px)] pb-[clamp(34px,5.5vw,64px)]">
        <Breadcrumb trail={["Woman", "Silai — Made to Order"]} tone="light" />

        <p className="m-0 mt-[clamp(20px,3vw,34px)] flex items-center gap-3 text-[11.5px] tracking-[0.3em] uppercase text-champagne">
          <span aria-hidden className="h-px w-[clamp(22px,3vw,40px)] bg-gold" />
          {silaiBanner.eyebrow}
        </p>

        <h1 className="mt-[clamp(10px,1.4vw,16px)] mb-0 max-w-[16ch] font-display font-normal text-cream text-[clamp(36px,5.6vw,72px)] leading-[1.04] text-pretty">
          {silaiBanner.title}
        </h1>

        <p className="mt-[clamp(14px,1.8vw,20px)] mb-0 max-w-[58ch] text-[clamp(15px,1.05vw,16.5px)] leading-[1.7] text-sandstone">
          {silaiBanner.intro}
        </p>

        {/* Side by side the pair overruns a phone and wraps to two buttons of
            different widths; below `sm` it is a column of two full-width ones
            instead, which is the same pair with an edge to line up on. */}
        <div className="mt-[clamp(24px,3vw,34px)] flex flex-col sm:flex-row sm:flex-wrap gap-3">
          <a
            href={silaiOrderHref}
            className="block sm:inline-block text-center bg-gold text-ink hover:text-ink px-[clamp(28px,3vw,40px)] py-4 text-[13.5px] tracking-[0.18em] uppercase transition-transform duration-300 hover:-translate-y-0.5"
          >
            Start a Silai Order
          </a>
          <a
            href="#how"
            className="block sm:inline-block text-center border border-cream/60 text-cream hover:text-cream px-[clamp(28px,3vw,40px)] py-4 text-[13.5px] tracking-[0.18em] uppercase transition-colors duration-300 hover:bg-cream/10"
          >
            How it works
          </a>
        </div>

        {/*
          A wrapping row put two stats on the first line and left the third
          hanging under the wider of them. Two fixed columns on a phone give
          the set a grid to sit on, so the values line up down the left edge
          however long the labels beside them run.
        */}
        <dl className="mt-[clamp(28px,4vw,44px)] grid grid-cols-2 gap-x-6 gap-y-6 sm:flex sm:flex-wrap sm:gap-x-[clamp(28px,5vw,72px)] sm:gap-y-5 border-t border-cream/15 pt-[clamp(18px,2.4vw,28px)]">
          {silaiBanner.stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <dt className="order-2 text-[11.5px] tracking-[0.2em] uppercase text-taupe">
                {stat.label}
              </dt>
              <dd className="order-1 m-0 font-display text-[clamp(20px,2.4vw,28px)] leading-none text-champagne">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
