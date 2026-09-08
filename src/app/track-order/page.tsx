import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageFrame } from "@/components/layout/page-frame";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { Values } from "@/components/sections/values";
import { WhatsAppIcon } from "@/components/ui/icons";
import { TrackOrderForm } from "@/app/track-order/track-form";
import { COURIERS } from "@/modules/shipping";
import { contact, whatsappHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Track your order",
  description:
    "Follow a FEEZEE parcel from the workshop to your door. Enter your order number and the email you ordered with — no account needed.",
  robots: { index: true, follow: true },
  /*
   * The emails link here with the customer's address in the query string, and
   * the tracking result then offers an outbound link to the courier. Without
   * this, that click would hand the courier the whole URL — email included —
   * in a Referer header.
   */
  referrer: "no-referrer",
};

/**
 * Where a parcel is, for someone who checked out as a guest.
 *
 * The whole point is that it needs no account: most FEEZEE orders are placed
 * without one, and "sign in to see your order" is not an answer to "where is
 * my order". The order number and the email together are the credential, and
 * they are both in the confirmation email the customer is already holding.
 */
export default function TrackOrderPage() {
  return (
    <PageFrame>
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(20px,3vw,40px)] pb-[clamp(30px,4vw,56px)]">
        <Breadcrumb trail={["Track Order"]} />

        <p className="m-0 mt-[clamp(20px,3vw,34px)] flex items-center gap-3 text-[12.5px] tracking-[0.3em] uppercase text-muted">
          <span aria-hidden className="h-px w-[clamp(22px,3vw,40px)] bg-gold/70" />
          Where is my order
        </p>

        <h1 className="mt-[clamp(8px,1.2vw,14px)] mb-0 font-display font-normal text-[clamp(32px,5vw,58px)] leading-[1.05] uppercase">
          Track your order
        </h1>

        <p className="mt-[clamp(10px,1.4vw,16px)] mb-0 font-display text-[clamp(17px,2vw,24px)] leading-[1.3] text-gold-dark">
          Track any order — no account or login required
        </p>

        <p className="mt-[clamp(12px,1.6vw,18px)] mb-0 max-w-[62ch] text-[15.5px] leading-[1.7] text-cocoa">
          Enter the order number from your confirmation email — that is all we
          need. We deliver across Dubai and all 7 Emirates, and every parcel is
          tracked from the moment it leaves the workshop.
        </p>

        <div className="mt-[clamp(26px,3.4vw,44px)]">
          {/*
           * The form reads `?order=` off the URL so a tap in the confirmation
           * email lands on the parcel rather than on an empty box. That is a
           * `useSearchParams` read, and the boundary is what keeps everything
           * above it — and the whole page for a visitor arriving without
           * params — prerendered as static HTML.
           */}
          <Suspense fallback={<FormSkeleton />}>
            <TrackOrderForm />
          </Suspense>
        </div>

        <div className="mt-[clamp(36px,5vw,68px)] flex flex-wrap items-start gap-x-[clamp(28px,4vw,64px)] gap-y-8 border-t border-line pt-[clamp(24px,3vw,36px)]">
          <div className="flex-[1_1_280px]">
            <h2 className="m-0 mb-3 text-[13px] tracking-[0.22em] uppercase font-normal">
              Who carries our parcels
            </h2>
            <ul className="m-0 p-0 list-none flex flex-col gap-2">
              {COURIERS.map((courier) => (
                <li
                  key={courier.id}
                  className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-[14px] leading-[1.6] border-b border-line pb-2 last:border-b-0"
                >
                  <span className="text-ink">{courier.name}</span>
                  <span className="text-muted">{courier.transit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-[1_1_280px]">
            <h2 className="m-0 mb-3 text-[13px] tracking-[0.22em] uppercase font-normal">
              Still cannot find it
            </h2>
            <p className="m-0 mb-4 text-[14.5px] leading-[1.7] text-cocoa">
              A tracking number appears here the moment the parcel is handed
              over — before that, the order is still being prepared. If the
              details are not matching, message us with your order number, or
              come and see us at {contact.address.oneLine}.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={whatsappHref("Hello FEEZEE, I would like to track my order.")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 border border-line text-ink hover:text-ink px-6 py-3.5 text-[12.5px] tracking-[0.16em] uppercase"
              >
                <WhatsAppIcon />
                WhatsApp us
              </a>
              <Link
                href="/account/orders"
                className="text-[12.5px] tracking-[0.14em] uppercase text-gold-dark hover:text-ink"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Values />
    </PageFrame>
  );
}

/**
 * What stands in the form's place in the prerendered HTML.
 *
 * Drawn to the same box and the same rhythm as the real thing, so the swap at
 * hydration is a fill rather than a jump.
 */
function FormSkeleton() {
  return (
    <div
      aria-hidden
      className="flex flex-col gap-5 border border-line bg-panel p-[clamp(22px,3.4vw,38px)] max-w-[560px]"
    >
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <span className="h-[13px] w-[110px] bg-line/70" />
          <span className="h-[46px] w-full border border-line" />
          <span className="h-[13px] w-[220px] max-w-full bg-line/45" />
        </div>
      ))}
      <span className="h-[48px] w-[190px] bg-ink/15" />
    </div>
  );
}
