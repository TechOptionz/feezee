import { silaiPricing, silaiPricingNotes } from "@/content/silai";

/**
 * The stitching charges, as a table on ink.
 *
 * The rest of the page is cream; this band is the dark one, because a price
 * list is the thing a shopper scrolls back up to find and a change of ground
 * makes it findable. The detail line sits inside the garment cell rather than
 * in a fourth column, so the table holds three columns at every width and
 * never needs to scroll sideways.
 */
export function SilaiPricing() {
  return (
    <section className="mt-[clamp(48px,8vw,100px)] bg-ink text-sandstone py-[clamp(44px,6.5vw,86px)]">
      {/*
        The band is full-bleed but its contents are not: the padding sits on
        the inner container, so the heading starts on the same vertical as
        every cream section above and below it.
      */}
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px]">
        <p className="m-0 flex items-center gap-3 text-[12.5px] tracking-[0.3em] uppercase text-gold">
          <span aria-hidden className="h-px w-[clamp(22px,3vw,40px)] bg-gold" />
          Stitching charges
        </p>

        <div className="mt-[clamp(8px,1.2vw,14px)] flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <h2 className="m-0 font-display font-normal text-champagne text-[clamp(26px,3.8vw,44px)] leading-[1.1] max-w-[18ch] text-pretty">
            What it costs, before you ask
          </h2>
          <p className="m-0 max-w-[40ch] text-[15.5px] leading-[1.7]">
            No quotation to wait for on a standard cut. These are the rates the
            workshop runs on, and they are the same in July as in Ramzan.
          </p>
        </div>

        <table className="mt-[clamp(26px,3.5vw,44px)] w-full border-collapse text-left">
          <caption className="sr-only">
            FEEZEE Silai stitching charges and turnaround by garment
          </caption>
          <thead>
            <tr className="border-b border-ink-border">
              <th
                scope="col"
                className="py-3 pr-4 text-[12px] font-normal tracking-[0.2em] uppercase text-taupe"
              >
                Garment
              </th>
              {/*
                Three columns hold at every width, but on a phone they hold by
                squeezing the garment down to about eighty pixels — enough to
                break "Bridal / heavy formal" over three lines and its
                description over three more. Below `nav` the turnaround folds
                under the price in the cell beside it instead, which is where
                the eye already goes for it, and the garment gets the width
                back.
              */}
              <th
                scope="col"
                className="py-3 px-4 text-right text-[12px] font-normal tracking-[0.2em] uppercase text-taupe whitespace-nowrap"
              >
                Stitching
              </th>
              <th
                scope="col"
                className="hidden nav:table-cell py-3 pl-4 text-right text-[12px] font-normal tracking-[0.2em] uppercase text-taupe whitespace-nowrap"
              >
                Ready in
              </th>
            </tr>
          </thead>
          <tbody>
            {silaiPricing.map((row) => (
              <tr
                key={row.garment}
                className="border-b border-ink-line transition-colors duration-200 hover:bg-cream/[0.04]"
              >
                <th
                  scope="row"
                  className="py-[clamp(14px,1.8vw,20px)] pr-4 font-normal align-top"
                >
                  <span className="block font-display text-[clamp(16px,1.5vw,19px)] leading-[1.3] text-champagne">
                    {row.garment}
                  </span>
                  <span className="mt-1 block text-[14px] leading-[1.5] text-taupe">
                    {row.detail}
                  </span>
                </th>
                <td className="py-[clamp(14px,1.8vw,20px)] pl-3 nav:px-4 text-right align-top font-display text-[clamp(16px,1.5vw,19px)] text-gold whitespace-nowrap">
                  {row.stitching}
                  <span className="nav:hidden mt-1 block font-body text-[14px] text-sandstone">
                    {row.turnaround}
                  </span>
                </td>
                <td className="hidden nav:table-cell py-[clamp(14px,1.8vw,20px)] pl-4 text-right align-top text-[14.5px] whitespace-nowrap">
                  {row.turnaround}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="m-0 mt-[clamp(20px,2.6vw,30px)] p-0 list-none grid grid-cols-1 nav:grid-cols-3 gap-x-8 gap-y-3">
          {silaiPricingNotes.map((note) => (
            <li
              key={note}
              className="flex gap-3 text-[14px] leading-[1.6] text-taupe"
            >
              <span aria-hidden className="mt-[10px] h-px w-3.5 shrink-0 bg-gold" />
              {note}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
