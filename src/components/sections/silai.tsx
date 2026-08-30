import Image from "next/image";
import Link from "next/link";
import { img } from "@/lib/assets";

/**
 * The Silai panel on the home page.
 *
 * It is the trailer for `/silai` rather than the service itself: the prices,
 * the measurements and the answers all live on the page now, and this says
 * only enough to make someone want them. The `id` stays so that older links
 * to `/#silai` still land somewhere sensible.
 */
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
        <div className="flex-[1_1_320px] p-[clamp(24px,5vw,64px)] flex flex-col justify-center gap-4">
          <div className="text-[13px] tracking-[0.32em] uppercase text-gold">Silai Fashion</div>
          <h2 className="font-display font-normal text-[clamp(26px,3.6vw,40px)] leading-[1.15] m-0 text-pretty">
            Stitched to your measurements, delivered to your door
          </h2>
          <p className="m-0 text-[15.5px] leading-[1.7] text-cocoa max-w-[46ch]">
            Choose any design, share your measurements on WhatsApp, and our tailors cut and finish
            each piece by hand. Free alterations on every order.
          </p>
          {/* Stacked on a phone, so the panel's one button spans the panel
              rather than stopping wherever its words do. */}
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-x-6 gap-y-4">
            <Link
              href="/silai"
              className="text-center bg-ink text-cream hover:text-cream px-[30px] py-3.5 text-[14px] tracking-[0.18em] uppercase transition-transform duration-300 hover:-translate-y-0.5"
            >
              Start a Silai Order
            </Link>
            <Link
              href="/silai#how"
              className="self-start text-[13.5px] tracking-[0.16em] uppercase text-gold-dark hover:text-ink border-b border-current pb-0.5"
            >
              How it works →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
