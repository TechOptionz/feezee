import Link from "next/link";
import { silaiChecklist } from "@/content/silai";
import { contact, whatsappHref } from "@/lib/site";

/**
 * The band the whole page points at.
 *
 * Every "Start a Silai Order" button on the route is an anchor to `#start`, so
 * this is where a visitor lands after reading any part of it. What it gives
 * them is the message itself: the five things to put in a first WhatsApp, in
 * the order a tailor wants them, so nobody has to open a chat and then work out
 * what to say.
 *
 * The button opens WhatsApp on the shop's own number with the first line
 * already typed, so the chat starts where the checklist leaves off.
 */
export function SilaiStart() {
  return (
    <section
      id="start"
      className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(48px,8vw,100px)] scroll-mt-24"
    >
      <div className="bg-panel px-[clamp(22px,4.4vw,64px)] py-[clamp(32px,4.6vw,64px)] flex flex-wrap gap-x-[clamp(30px,5vw,80px)] gap-y-9">
        <div className="flex-[1_1_320px] flex flex-col gap-4">
          <p className="m-0 text-[13px] tracking-[0.32em] uppercase text-gold">
            Start your order
          </p>
          <h2 className="m-0 font-display font-normal text-[clamp(26px,3.8vw,44px)] leading-[1.12] max-w-[16ch] text-pretty">
            One message is the whole of it
          </h2>
          <p className="m-0 max-w-[46ch] text-[15.5px] leading-[1.7] text-cocoa">
            Send us the five things on the right and we will come back the same
            day with a price, a date and anything we still need to know. Nothing
            is charged until the cut is agreed.
          </p>

          {/* The ask the whole page points at, so on a phone it takes the full
              width of the panel rather than ending wherever its words do. */}
          <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-x-7 gap-y-4">
            <a
              href={whatsappHref(
                "Assalam-o-Alaikum FEEZEE — I would like to start a Silai order.",
              )}
              target="_blank"
              rel="noreferrer"
              className="text-center bg-ink text-cream hover:text-cream px-[clamp(26px,3vw,38px)] py-4 text-[14px] tracking-[0.18em] uppercase transition-transform duration-300 hover:-translate-y-0.5"
            >
              Message us on WhatsApp
            </a>
            <Link
              href="/new-in"
              className="self-start text-[13.5px] tracking-[0.16em] uppercase text-gold-dark hover:text-ink border-b border-current pb-0.5"
            >
              Browse designs first &rarr;
            </Link>
          </div>

          <p className="m-0 mt-1 text-[13.5px] tracking-[0.06em] text-muted">
            {contact.whatsapp.display} · Replies {contact.hours}
          </p>
        </div>

        <div className="flex-[1_1_300px]">
          <p className="m-0 mb-4 text-[12.5px] tracking-[0.22em] uppercase text-cocoa">
            Put this in the message
          </p>
          <ol className="m-0 p-0 list-none flex flex-col">
            {silaiChecklist.map((item, i) => (
              <li
                key={item}
                className="flex items-center gap-4 border-t border-ink/10 py-3.5 last:border-b text-[15.5px] leading-[1.5] text-ink"
              >
                <span className="font-display text-[14px] text-gold w-5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
