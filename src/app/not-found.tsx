import type { Metadata } from "next";
import Link from "next/link";
import { PageFrame } from "@/components/layout/page-frame";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { Values } from "@/components/sections/values";

export const metadata: Metadata = {
  title: "Garment not found",
  description:
    "The page you were looking for is not on the rail. Return to the boutique or track an existing order.",
  robots: { index: false, follow: true },
};

/**
 * The 404, in the voice of the boutique.
 *
 * A missing page is almost always a garment that has sold out or a link from
 * an old campaign, so the copy speaks to that rather than to the protocol. The
 * two exits mirror the two reasons someone lands here: they were browsing, or
 * they came from an email about a parcel and mistyped the address.
 */
export default function NotFound() {
  return (
    <PageFrame>
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(20px,3vw,40px)] pb-[clamp(30px,4vw,56px)]">
        <Breadcrumb trail={["Not found"]} />

        <section className="grid gap-x-[clamp(32px,6vw,96px)] gap-y-10 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] items-start mt-[clamp(28px,5vw,64px)] pb-[clamp(36px,5vw,72px)]">
          <div>
            <p className="m-0 flex items-center gap-3 text-[12.5px] tracking-[0.3em] uppercase text-muted">
              <span aria-hidden className="h-px w-[clamp(22px,3vw,40px)] bg-gold/70" />
              404 — Not on the rail
            </p>

            <h1 className="mt-[clamp(8px,1.2vw,14px)] mb-0 font-display font-normal text-[clamp(38px,6vw,72px)] leading-[1.02] uppercase">
              Garment
              <br />
              Not Found
            </h1>

            <p className="mt-[clamp(10px,1.4vw,16px)] mb-0 font-display text-[clamp(17px,2vw,24px)] leading-[1.3] text-gold-dark">
              The piece you were looking for is no longer hanging here
            </p>

            <p className="mt-[clamp(14px,1.8vw,22px)] mb-0 max-w-[58ch] text-[15.5px] leading-[1.75] text-cocoa">
              Our collections are cut in small numbers, so a garment may have
              sold through, moved to a new line, or been retired for the season.
              The address may also have been typed with a small slip. Either
              way, the rail is never empty — the newest pieces are a step away.
            </p>

            <div className="mt-[clamp(26px,3.4vw,44px)] flex flex-col sm:flex-row sm:flex-wrap gap-4">
              <Link
                href="/new-in"
                className="inline-flex items-center justify-center text-center bg-gold text-ink hover:text-ink px-[clamp(28px,3vw,40px)] py-4 text-[13px] tracking-[0.18em] uppercase transition-transform duration-300 hover:-translate-y-0.5"
              >
                Return to Boutique Rail
              </Link>
              <Link
                href="/track-order"
                className="inline-flex items-center justify-center text-center border border-ink text-ink hover:text-cream hover:bg-ink px-[clamp(28px,3vw,40px)] py-4 text-[13px] tracking-[0.18em] uppercase transition-colors duration-300"
              >
                Track an Existing Order
              </Link>
            </div>
          </div>

          {/*
           * An empty hanger drawn in hairlines: the whole page is about a space
           * on the rail, so the illustration is the space rather than a
           * garment. It is decorative and hidden from assistive technology.
           */}
          <div className="hidden md:flex justify-center border border-line bg-panel px-10 py-[clamp(40px,6vw,72px)]">
            <EmptyHanger />
          </div>
        </section>

        <div className="border-t border-line pt-[clamp(24px,3vw,36px)] flex flex-wrap items-start gap-x-[clamp(28px,4vw,64px)] gap-y-8">
          <div className="flex-[1_1_260px]">
            <h2 className="m-0 mb-3 text-[13px] tracking-[0.22em] uppercase font-normal">
              Browse the lines
            </h2>
            <ul className="m-0 p-0 list-none flex flex-col gap-2">
              {LINES.map((line) => (
                <li key={line.href} className="border-b border-line pb-2 last:border-b-0">
                  <Link
                    href={line.href}
                    className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-[14px] leading-[1.6] text-ink hover:text-gold-dark"
                  >
                    <span>{line.label}</span>
                    <span className="text-muted">{line.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-[1_1_260px]">
            <h2 className="m-0 mb-3 text-[13px] tracking-[0.22em] uppercase font-normal">
              Looking for something in particular
            </h2>
            <p className="m-0 text-[14.5px] leading-[1.7] text-cocoa">
              If a piece you loved has sold through, our Silai atelier can cut
              it again to your measurements. Visit the{" "}
              <Link href="/silai" className="text-gold-dark hover:text-ink">
                made-to-order page
              </Link>{" "}
              to begin, or reach us through the assistant in the corner of the
              screen.
            </p>
          </div>
        </div>
      </div>

      <Values />
    </PageFrame>
  );
}

const LINES = [
  { href: "/new-in", label: "New In", note: "This season's arrivals" },
  { href: "/luxury-pret", label: "Luxury Pret", note: "Embroidered occasionwear" },
  { href: "/ready-to-wear", label: "Ready to Wear", note: "Everyday kurtas" },
  { href: "/printed-lawn", label: "Printed Lawn", note: "Summer prints" },
  { href: "/sale", label: "Sale", note: "Last pieces on the rail" },
];

/** A single wooden hanger on a rail, drawn in the brand's hairline gold. */
function EmptyHanger() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 200"
      width="240"
      height="200"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gold w-[clamp(160px,22vw,240px)] h-auto"
    >
      {/* rail */}
      <line x1="8" y1="24" x2="232" y2="24" />
      <circle cx="120" cy="24" r="3" fill="currentColor" stroke="none" />
      {/* hook */}
      <path d="M120 27v8c0 8 10 8 10 0v-2c0-6-10-8-10 4" />
      <path d="M120 45v10" />
      {/* hanger shoulders */}
      <path d="M120 55 L24 118" />
      <path d="M120 55 L216 118" />
      <path d="M24 118 Q20 126 30 126 L210 126 Q220 126 216 118" />
      {/* cross bar */}
      <line x1="60" y1="126" x2="180" y2="126" />
      {/* a whisper of where the garment hung */}
      <path
        d="M70 140 Q120 160 170 140"
        strokeDasharray="3 6"
        className="text-gold/50"
      />
      <path
        d="M80 156 Q120 172 160 156"
        strokeDasharray="3 6"
        className="text-gold/30"
      />
    </svg>
  );
}
