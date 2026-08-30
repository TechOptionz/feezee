import { silaiFinishes } from "@/content/silai";

/**
 * The choices that come after the measurements, set as rows of chips.
 *
 * These are not filters and nothing here is clickable — the choosing happens
 * in the conversation on WhatsApp. What the section is for is showing that the
 * vocabulary exists, so a customer who only knows "the one with the wide
 * bottom" arrives already able to say sharara.
 */
export function SilaiFinishes() {
  return (
    <section className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(48px,8vw,100px)]">
      <p className="m-0 flex items-center gap-3 text-[12.5px] tracking-[0.3em] uppercase text-muted">
        <span aria-hidden className="h-px w-[clamp(22px,3vw,40px)] bg-gold/70" />
        Choose the finish
      </p>

      <h2 className="mt-[clamp(8px,1.2vw,14px)] mb-0 font-display font-normal text-[clamp(26px,3.8vw,44px)] leading-[1.1] max-w-[22ch] text-pretty">
        Every seam on the piece is a decision you get to make
      </h2>

      <p className="mt-3 mb-0 max-w-[60ch] text-[15px] leading-[1.7] text-cocoa">
        Say as much or as little as you like. Anything you leave to us we cut
        the way the design was drawn.
      </p>

      <dl className="m-0 mt-[clamp(26px,3.5vw,44px)] flex flex-col">
        {silaiFinishes.map((group) => (
          <div
            key={group.title}
            className="flex flex-wrap items-baseline gap-x-[clamp(20px,3vw,48px)] gap-y-3.5 border-t border-line py-[clamp(16px,2vw,24px)] last:border-b"
          >
            {/*
              Beside the chips the label costs a fixed column, and on a phone
              that column was a third of the line — enough to push six short
              words onto three rows. Below `nav` the label takes a line of its
              own and hands the whole width back, so the chips set two and
              three abreast instead.
            */}
            <dt className="w-full shrink-0 nav:w-[clamp(96px,12vw,150px)] text-[12.5px] tracking-[0.22em] uppercase text-muted">
              {group.title}
            </dt>
            <dd className="m-0 flex flex-1 flex-wrap gap-2">
              {group.options.map((option) => (
                <span
                  key={option}
                  className="border border-line bg-cream px-3.5 py-2 text-[14px] tracking-[0.05em] text-ink transition-colors duration-200 hover:border-gold hover:text-gold-dark"
                >
                  {option}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
