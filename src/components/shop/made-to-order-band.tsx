import Link from "next/link";

/**
 * The Silai line, compressed into a band the shop pages can carry. The full
 * feature — photograph, standfirst and all — stays on the home page; this is
 * the one-line version for someone who has just scrolled a rail of standard
 * sizes and is wondering whether they can have it cut to their own.
 */
export function MadeToOrderBand({
  line = "Nothing on the rail in your size?",
}: {
  line?: string;
}) {
  return (
    <section className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(44px,7vw,90px)]">
      <div className="bg-ink text-sandstone px-[clamp(26px,4.4vw,60px)] py-[clamp(30px,4vw,54px)] flex flex-wrap items-center justify-between gap-x-10 gap-y-6">
        <div className="flex-[1_1_360px] flex flex-col gap-2.5">
          <div className="text-xs tracking-[0.32em] uppercase text-gold">
            Silai — Made to Order
          </div>
          <h2 className="font-display font-normal text-[clamp(23px,3vw,34px)] leading-[1.18] m-0 text-champagne text-pretty">
            {line}
          </h2>
          <p className="m-0 text-[14.5px] leading-[1.65] max-w-[52ch]">
            Send your measurements on WhatsApp and our tailors cut any design in
            this collection by hand. Free alterations on every order.
          </p>
        </div>

        {/* Below the band's own wrap the button has a whole line to itself, so
            it takes the width of it rather than sitting short of the edge. */}
        <Link
          href="/silai"
          className="w-full text-center nav:w-auto shrink-0 bg-gold text-ink hover:text-ink px-[30px] py-4 nav:py-3.5 text-[12.5px] tracking-[0.18em] uppercase"
        >
          Start a Silai Order
        </Link>
      </div>
    </section>
  );
}
