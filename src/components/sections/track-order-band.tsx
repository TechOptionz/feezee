import Link from "next/link";
import { whatsappHref } from "@/lib/site";

/**
 * The one thing on the home page that is not for shopping.
 *
 * Tracking a parcel was a link in the footer, which is the right place for it
 * once you know it exists and the wrong one for someone who has just opened
 * the site to ask where their order is. That customer is not browsing, and
 * making them read past four rails of new-in to find a word in the footer is
 * how a WhatsApp message gets sent instead.
 *
 * On the ink ground rather than the sand of the sections around it, so it
 * reads as a different kind of thing at a glance and not as another rail.
 * Placed low on purpose all the same: a shop's home page sells first, and
 * anyone here to track already knows to look for it.
 */
export function TrackOrderBand() {
  return (
    <section className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(48px,8vw,100px)]">
      <div className="bg-ink text-cream flex flex-wrap items-center justify-between gap-x-10 gap-y-6 px-[clamp(24px,5vw,56px)] py-[clamp(28px,4vw,44px)]">
        <div className="flex-[1_1_320px] flex flex-col gap-2.5">
          <div className="text-[13px] tracking-[0.32em] uppercase text-gold">
            Already ordered?
          </div>
          <h2 className="font-display font-normal text-[clamp(24px,3.2vw,34px)] leading-[1.15] m-0 text-pretty">
            Track your order
          </h2>
          {/* The no-account part is the whole point of the page, so it is said
              here rather than discovered after clicking through. */}
          <p className="m-0 text-[15px] leading-[1.7] text-champagne max-w-[46ch]">
            Your order number is all you need — no account, no sign-in. It is
            printed at the top of your confirmation email.
          </p>
        </div>

        {/* Stacked and full width on a phone, so the button is a band across
            the panel rather than stopping wherever its words do. */}
        <div className="flex-[0_1_auto] w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-x-7 gap-y-4">
          <Link
            href="/track-order"
            className="text-center bg-cream text-ink hover:text-ink px-[34px] py-4 text-[14px] tracking-[0.18em] uppercase transition-transform duration-300 hover:-translate-y-0.5"
          >
            Track My Order
          </Link>
          <a
            href={whatsappHref(
              "Hello FEEZEE, I would like an update on my order.",
            )}
            target="_blank"
            rel="noreferrer"
            className="self-center sm:self-auto text-[13.5px] tracking-[0.16em] uppercase text-gold hover:text-cream border-b border-current pb-0.5"
          >
            Ask on WhatsApp →
          </a>
        </div>
      </div>
    </section>
  );
}
