import Image from "next/image";
import { img } from "@/lib/assets";

export function Silai() {
  return (
    <section
      id="silai"
      className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(48px,8vw,100px)]"
    >
      <div className="flex flex-wrap bg-panel">
        <div className="flex-[1_1_320px] min-h-[340px] relative overflow-hidden">
          <Image
            src={img("p14.jpg")}
            alt="Teal anarkali, made to order"
            fill
            sizes="(max-width: 860px) 100vw, 640px"
            className="object-cover object-top"
          />
        </div>
        <div className="flex-[1_1_320px] p-[clamp(30px,5vw,64px)] flex flex-col justify-center gap-4">
          <div className="text-xs tracking-[0.32em] uppercase text-gold">Silai Fashion</div>
          <h2 className="font-display font-normal text-[clamp(26px,3.6vw,40px)] leading-[1.15] m-0 text-pretty">
            Stitched to your measurements, delivered to your door
          </h2>
          <p className="m-0 text-[15.5px] leading-[1.7] text-cocoa max-w-[46ch]">
            Choose any design, share your measurements on WhatsApp, and our tailors cut and finish
            each piece by hand. Free alterations on every order.
          </p>
          <a
            href="#footer"
            className="self-start bg-ink text-cream hover:text-cream px-[30px] py-3.5 text-[13px] tracking-[0.18em] uppercase"
          >
            Start a Silai Order
          </a>
        </div>
      </div>
    </section>
  );
}
