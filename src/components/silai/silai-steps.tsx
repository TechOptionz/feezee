import { silaiSteps } from "@/content/silai";

/**
 * The four steps, laid on a single hairline.
 *
 * The rule runs behind the numerals and each numeral sits on a cream disc
 * punched out of it, so on a wide screen the row reads as one process rather
 * than four unrelated cards. Below the nav breakpoint the columns stack and
 * the rule turns vertical, which is the same drawing rotated.
 */
export function SilaiSteps() {
  return (
    <section
      id="how"
      className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(48px,8vw,100px)] scroll-mt-24"
    >
      <p className="m-0 flex items-center gap-3 text-[11.5px] tracking-[0.3em] uppercase text-muted">
        <span aria-hidden className="h-px w-[clamp(22px,3vw,40px)] bg-gold/70" />
        The process
      </p>

      <h2 className="mt-[clamp(8px,1.2vw,14px)] mb-0 font-display font-normal text-[clamp(26px,3.8vw,44px)] leading-[1.1] max-w-[20ch] text-pretty">
        Four steps, and none of them is a fitting room
      </h2>

      <ol className="relative m-0 mt-[clamp(30px,4.5vw,56px)] p-0 list-none grid grid-cols-1 nav:grid-cols-4 gap-x-[clamp(20px,2.6vw,38px)] gap-y-9 nav:gap-y-10">
        {/*
         * One rule for the whole row, drawn under the numerals. It is inset by
         * half a disc at each end so it starts and stops inside the row rather
         * than running off both edges.
         */}
        <span
          aria-hidden
          className="hidden nav:block absolute left-[27px] right-[27px] top-[27px] h-px bg-line"
        />

        {silaiSteps.map((step, i) => (
          /*
           * Stacked, the row's single rule is the same drawing turned on its
           * side. That only works if the rule has a lane to itself, so below
           * `nav` the numeral comes out of the flow into a rail at the left
           * and the words sit in a column beside it — otherwise the line runs
           * straight through the paragraph under each numeral. The last step
           * begins nothing, so it draws no segment.
           */
          <li
            key={step.n}
            className="relative flex flex-col gap-3.5 min-h-[54px] pl-[70px] nav:min-h-0 nav:pl-0"
          >
            {i < silaiSteps.length - 1 && (
              <span
                aria-hidden
                className="nav:hidden absolute left-[26.5px] top-[54px] -bottom-9 w-px bg-line"
              />
            )}
            <span className="absolute nav:relative left-0 top-0 z-10 grid h-[54px] w-[54px] place-items-center rounded-full border border-line bg-cream font-display text-[17px] text-gold">
              {step.n}
            </span>
            <h3 className="m-0 font-display font-normal text-[clamp(18px,1.6vw,21px)] leading-[1.25] text-ink">
              {step.title}
            </h3>
            <p className="m-0 text-[14.5px] leading-[1.7] text-cocoa max-w-[38ch]">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
