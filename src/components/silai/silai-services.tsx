import Image from "next/image";
import { silaiOrderHref, silaiServices } from "@/content/silai";
import { img } from "@/lib/assets";

/**
 * What Silai will actually cut for you, in four cards.
 *
 * A shop page's grid can print a price because a garment has one. This is a
 * service, so each card prints the two numbers a service is judged on instead
 * — what it starts at, and how long it takes — pinned to the foot of the card
 * so the four line up across the row however long the blurbs run.
 */
export function SilaiServices() {
  return (
    <section className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(48px,8vw,100px)]">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div>
          <p className="m-0 flex items-center gap-3 text-[12.5px] tracking-[0.3em] uppercase text-muted">
            <span aria-hidden className="h-px w-[clamp(22px,3vw,40px)] bg-gold/70" />
            What we stitch
          </p>
          <h2 className="mt-[clamp(8px,1.2vw,14px)] mb-0 font-display font-normal text-[clamp(26px,3.8vw,44px)] leading-[1.1] max-w-[22ch] text-pretty">
            From an everyday kurta to a bridal shirt
          </h2>
        </div>
        <p className="m-0 max-w-[42ch] text-[15.5px] leading-[1.7] text-cocoa">
          Prices are for stitching. Bring your own cloth or buy it with the
          order — either way the charge below is the whole of it.
        </p>
      </div>

      <div className="mt-[clamp(26px,3.5vw,44px)] grid grid-cols-2 nav:grid-cols-4 gap-x-[clamp(16px,2vw,28px)] gap-y-[clamp(28px,3.5vw,44px)]">
        {silaiServices.map((service) => (
          <article key={service.name} className="group flex flex-col">
            <a
              href={silaiOrderHref}
              aria-label={`Start a Silai order — ${service.name}`}
              className="relative block aspect-[3/4] overflow-hidden bg-sand"
            >
              <Image
                src={img(service.image)}
                alt=""
                fill
                sizes="(max-width: 860px) 50vw, 25vw"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,rgba(43,33,24,0)_0%,rgba(43,33,24,0.55)_100%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
              <span className="absolute left-0 bottom-0 m-3.5 border border-ink/10 bg-cream/95 px-3 py-1.5 text-[12px] tracking-[0.16em] uppercase text-ink">
                {service.turnaround}
              </span>
            </a>

            <div className="flex flex-1 flex-col pt-4">
              <h3 className="m-0 font-display font-normal text-[clamp(18px,1.6vw,21px)] leading-[1.25] text-ink">
                {service.name}
              </h3>
              <p className="mt-2 mb-0 text-[15px] leading-[1.65] text-cocoa">
                {service.blurb}
              </p>
              {/*
                Two columns of these fit a phone, which leaves the label and
                the price too little room to sit on one line — so below the nav
                breakpoint the price drops under the label rather than both of
                them wrapping into each other.
              */}
              <div className="mt-auto flex flex-col gap-0.5 border-t border-line pt-3 nav:flex-row nav:items-baseline nav:justify-between nav:gap-3">
                <span className="text-[12px] tracking-[0.2em] uppercase text-muted">
                  Stitching from
                </span>
                <span className="font-display text-[17px] text-gold-dark whitespace-nowrap">
                  {service.from}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
