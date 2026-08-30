import { silaiFaqs } from "@/content/silai";

/**
 * The questions, as native `<details>`.
 *
 * An accordion is the one interactive thing on this page, and the browser
 * already ships it: no state, no client bundle, and the answers stay in the
 * page for search and for Ctrl+F even while they are closed. The only thing
 * the CSS adds is swapping the disclosure triangle for a plus that turns.
 */
export function SilaiFaq() {
  return (
    <section className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(48px,8vw,100px)]">
      <div className="flex flex-wrap gap-x-[clamp(30px,5vw,80px)] gap-y-8">
        <div className="flex-[1_1_260px] max-w-[34ch] self-start nav:sticky nav:top-10">
          <p className="m-0 flex items-center gap-3 text-[12.5px] tracking-[0.3em] uppercase text-muted">
            <span aria-hidden className="h-px w-[clamp(22px,3vw,40px)] bg-gold/70" />
            Before you order
          </p>
          <h2 className="mt-[clamp(8px,1.2vw,14px)] mb-0 font-display font-normal text-[clamp(26px,3.8vw,44px)] leading-[1.1] text-pretty">
            The things people ask us first
          </h2>
          <p className="mt-4 mb-0 text-[15px] leading-[1.7] text-cocoa">
            Anything not answered here, ask on WhatsApp — the team replies
            between 10am and 8pm, Monday to Saturday.
          </p>
        </div>

        <div className="flex-[2_1_460px]">
          {silaiFaqs.map((faq) => (
            <details
              key={faq.q}
              className="group border-b border-line first:border-t"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-[clamp(16px,2vw,22px)] text-[clamp(15px,1.2vw,17px)] leading-[1.45] text-ink transition-colors duration-200 hover:text-gold-dark [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span
                  aria-hidden
                  className="mt-0.5 shrink-0 text-[19px] leading-none text-gold transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="m-0 max-w-[68ch] pb-[clamp(18px,2.2vw,26px)] pr-8 text-[15.5px] leading-[1.75] text-cocoa">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
