import type { Metadata } from "next";
import {
  P,
  PolicyLink,
  PolicyList,
  PolicyNote,
  PolicyPage,
  PolicyRows,
  PolicySection,
} from "@/components/layout/policy-page";
import { getSettings } from "@/modules/shared/settings";
import { formatPrice } from "@/lib/currency";
import { contact, whatsappHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description:
    "Next-day delivery in Dubai, 1–2 days across all 7 Emirates, and free over AED 1,000. Seven days to return an unworn piece from the day it arrives.",
  alternates: { canonical: "/shipping-and-returns" },
};

/**
 * What the shop promises about getting a parcel to you and taking it back.
 *
 * Every figure on this page is read from `getSettings()` rather than typed
 * into the sentence. The free-delivery threshold, the courier fee and the
 * length of the return window are all editable, and a policy page that quotes
 * a number the checkout no longer charges is worse than no policy page — it is
 * a promise the shop is not keeping, in writing, on its own site.
 */

/** The seven emirates, in the order the copy reads them out. */
const EMIRATES =
  "Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah and Umm Al Quwain";

/*
 * The figures on this page come out of the database, so the page must not be
 * baked once at build time and left there. An hour is well inside the pace at
 * which a shop changes its delivery threshold, and far outside the pace at
 * which anyone reads a policy twice.
 */
export const revalidate = 3600;

const UPDATED = "9 September 2026";

export default async function ShippingAndReturnsPage() {
  const { freeShippingThresholdAed, standardShippingFeeAed, returnWindowDays, vatRate } =
    await getSettings();

  const threshold = formatPrice(freeShippingThresholdAed);
  const fee = formatPrice(standardShippingFeeAed);

  return (
    <PolicyPage
      title="Shipping & Returns"
      eyebrow="Delivery and returns"
      standfirst={`Next working day inside Dubai, one to two days everywhere else in the UAE, and ${returnWindowDays} days to change your mind once the parcel is in your hands.`}
      updated={UPDATED}
    >
      <PolicySection heading="Where we deliver, and how long it takes">
        <P>
          Every FEEZEE order is dispatched from our workshop at Madina Mall, Al
          Muhaisnah 4, and we deliver to all seven emirates — {EMIRATES}. An
          order placed while the shop is open is packed the same day; anything
          later goes out the next morning.
        </P>

        <PolicyRows
          rows={[
            {
              term: "Dubai",
              detail: "Next working day, by our own rider or a local courier.",
            },
            {
              term: "All other emirates",
              detail:
                "One to two working days by Aramex, Emirates Post or Fetchr.",
            },
            {
              term: "Made to order (Silai)",
              detail:
                "Four to six weeks depending on the piece, then delivered on the schedule above.",
            },
          ]}
        />

        <P>
          The counter is open {contact.hours}, and Sundays and UAE public
          holidays are not working days for us or for our couriers. A parcel
          that would land on one arrives the next working day instead.
        </P>
      </PolicySection>

      <PolicySection heading="What delivery costs">
        <PolicyList
          items={[
            <>
              <strong className="font-normal text-ink">Free</strong> on every
              order with a subtotal of {threshold} or more.
            </>,
            <>
              <strong className="font-normal text-ink">{fee}</strong>, flat, on
              everything below it — the same fee wherever in the UAE you are.
            </>,
          ]}
        />
        <P>
          The threshold is tested against the subtotal of the garments, before
          VAT. Delivery, where it is charged, carries {Math.round(vatRate * 100)}%
          VAT like everything else on the order, and the bag shows you how much
          further you have to go before it becomes free.
        </P>
        <P>
          We accept cash on delivery, bank transfer and cards. Cash on delivery
          is counted at your door and receipted the same day.
        </P>
      </PolicySection>

      <PolicySection heading={`Returns — ${returnWindowDays} days from delivery`}>
        <P>
          You have {returnWindowDays} days from the day your parcel is delivered
          to ask to send a piece back. The window runs from delivery, not from
          the day you ordered: a parcel that took a week to reach you has not
          eaten a week of your {returnWindowDays} days.
        </P>

        <P>A piece can come back to us if it is:</P>
        <PolicyList
          items={[
            "Unworn and unwashed, other than trying it on.",
            "Still carrying its original tags, attached as they were sent.",
            "In the packaging it arrived in, with nothing missing from a set — a three-piece comes back as three pieces, dupatta included.",
            "Free of perfume, deodorant, make-up and alteration marks.",
          ]}
        />

        <PolicyNote title="Faulty or wrong">
          <P>
            If a piece arrives damaged, flawed or simply is not what you
            ordered, none of the above applies and neither does the window. Send
            us a photograph and we will collect it, replace it or refund it in
            full, delivery included. Nothing on this page limits your rights
            under UAE consumer protection law.
          </P>
        </PolicyNote>
      </PolicySection>

      <PolicySection heading="How to send something back">
        <P>
          Two ways, and neither of them needs a form printed out.{" "}
          <PolicyLink href="/account/returns">
            Open a return in your account
          </PolicyLink>{" "}
          — pick the order, tick the pieces and tell us why — or{" "}
          <PolicyLink
            href={whatsappHref(
              "Hello FEEZEE, I would like to return an order. My order number is ",
            )}
          >
            message us on WhatsApp
          </PolicyLink>{" "}
          with your order number.
        </P>
        <P>
          We reply with a collection slot or a drop-off, depending on where you
          are. Collection inside the UAE is arranged by us; you do not need to
          find a courier yourself. If you ordered as a guest, WhatsApp is the
          route — you can look the parcel up any time on{" "}
          <PolicyLink href="/track-order">Track Order</PolicyLink> without an
          account.
        </P>
      </PolicySection>

      <PolicySection heading="Refunds">
        <P>
          Once the piece is back with us it is checked against the conditions
          above, which usually takes a working day. When it passes, the refund
          is issued to the method you paid with and takes{" "}
          <strong className="font-normal text-ink">five to seven working days</strong>{" "}
          to appear.
        </P>

        <PolicyRows
          rows={[
            {
              term: "Card",
              detail:
                "Back to the same card through our payment provider. Five to seven working days, depending on your bank.",
            },
            {
              term: "Bank transfer",
              detail:
                "Back to the account the payment came from, five to seven working days after we confirm the details with you.",
            },
            {
              term: "Cash on delivery",
              detail:
                "By bank transfer to an account in your name, five to seven working days from when you send us the details.",
            },
          ]}
        />

        <P>
          The delivery fee, where one was charged, is refunded only when the
          whole order goes back or the piece was faulty. Exchanges for a
          different size are handled the same way and carry no second delivery
          charge.
        </P>
      </PolicySection>

      <PolicySection heading="Made to measure: Silai">
        <P>
          A Silai piece is cut to measurements you gave us, for you. That
          changes both halves of this page, and in opposite directions.
        </P>

        <PolicyNote title="Alterations" tone="wine">
          <P>
            <strong className="font-normal text-ink">
              Alterations are free, for as long as you own the piece.
            </strong>{" "}
            If a seam wants moving, send it back or bring it in to Madina Mall.
            We cover return postage on the first alteration, anywhere in the
            UAE. There is no window on this and no limit to how many times you
            use it.
          </P>
          <P>
            <strong className="font-normal text-ink">
              A made-to-measure piece cannot be refunded once the cloth is cut.
            </strong>{" "}
            It cannot be sold to anyone else, which is why it is priced the way
            it is. Until we cut, you can cancel a Silai order in full — tell us
            on WhatsApp and we will confirm where in the process it has reached.
          </P>
        </PolicyNote>

        <P>
          This does not cover a Silai piece that arrives faulty or that was cut
          against the measurements on your order. That is our mistake, and we
          remake it or refund it.
        </P>
      </PolicySection>

      <PolicySection heading="Sale pieces">
        <P>
          Reduced pieces carry the same {returnWindowDays}-day return right and
          the same stitching guarantee as anything else on the site. What they
          cannot promise is a replacement: sale sizes are the end of a lot, so
          an exchange depends on what is still on the rail, and a refund is
          offered where it is not.
        </P>
      </PolicySection>
    </PolicyPage>
  );
}
