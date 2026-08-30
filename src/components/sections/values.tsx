import { values } from "@/content/values";

/**
 * The four promises, on a rule at the foot of a page.
 *
 * `auto-fit` used to decide the column count, which on a phone landed on two
 * columns whose titles were one line on one side and two on the other — so the
 * sentences under them started at different heights and the row read as
 * ragged. The count is stated instead, and each cell is a subgrid of the row's
 * own two tracks: every title band is as tall as the tallest title, so the
 * sentences all begin on the same line.
 */
export function Values() {
  return (
    <section className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(40px,6vw,72px)]">
      <div className="grid grid-cols-2 nav:grid-cols-4 gap-x-[22px] gap-y-7 nav:gap-y-[22px] text-center border-y border-line py-8 nav:py-[30px]">
        {values.map((value) => (
          <div
            key={value.title}
            className="grid grid-rows-subgrid row-span-2 gap-[5px] px-2"
          >
            <div className="font-display text-[17px] text-gold">{value.title}</div>
            <div className="text-[13px] text-cocoa leading-[1.5]">{value.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
