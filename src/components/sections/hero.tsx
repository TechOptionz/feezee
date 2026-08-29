import Image from "next/image";
import { img } from "@/lib/assets";

export function Hero() {
  return (
    <section id="top" className="relative h-[clamp(540px,82vh,760px)] overflow-hidden">
      <Image
        src={img("p19.jpg")}
        alt="FEEZEE festive anarkali"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[50%_18%]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(43,33,24,0)_34%,rgba(43,33,24,0.72)_100%)]" />
      <div className="absolute left-0 right-0 bottom-0 px-[22px] pb-[46px] max-w-[var(--fz-container)] mx-auto text-cream">
        <div className="text-xs tracking-[0.34em] uppercase text-champagne mb-3">
          Festive &apos;26 Collection
        </div>
        <h1 className="font-display font-normal text-[clamp(34px,6vw,62px)] leading-[1.08] m-0 mb-[18px] max-w-[14ch] text-pretty">
          Elegance, stitched the Pakistani way
        </h1>
        <div className="flex gap-3 flex-wrap">
          <a
            href="#new"
            className="inline-block bg-cream text-ink hover:text-ink px-[30px] py-3.5 text-[13px] tracking-[0.18em] uppercase"
          >
            Shop New In
          </a>
          <a
            href="#silai"
            className="inline-block border border-cream/70 text-cream hover:text-cream px-[30px] py-3.5 text-[13px] tracking-[0.18em] uppercase"
          >
            Made to Order
          </a>
        </div>
      </div>
    </section>
  );
}
