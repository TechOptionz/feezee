import type { Metadata } from "next";
import {
  P,
  PolicyLink,
  PolicyList,
  PolicyNote,
  PolicyPage,
  PolicySection,
} from "@/components/layout/policy-page";
import { getSettings } from "@/modules/shared/settings";
import { contact } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms you and FEEZEE SILAI FASHION L.L.C agree to when you place an order — prices, payment, delivery, cancellation and the law that governs them.",
  alternates: { canonical: "/terms" },
};

/**
 * The agreement an order is placed under.
 *
 * Kept short on purpose. A term nobody reads protects nobody, and the clauses
 * that actually decide an argument — when the contract forms, what the price
 * includes, when a made-to-measure piece stops being cancellable, which court
 * hears it — are worth more room than a page of boilerplate around them.
 */

/*
 * The figures on this page come out of the database, so the page must not be
 * baked once at build time and left there. An hour is well inside the pace at
 * which a shop changes its delivery threshold, and far outside the pace at
 * which anyone reads a policy twice.
 */
export const revalidate = 3600;

const UPDATED = "9 September 2026";

export default async function TermsPage() {
  const { vatRate, returnWindowDays } = await getSettings();
  const vatPct = Math.round(vatRate * 100);

  return (
    <PolicyPage
      title="Terms of Service"
      eyebrow="The agreement"
      standfirst="What you and FEEZEE agree to when you place an order. Written to be read once, in full, in a few minutes."
      updated={UPDATED}
    >
      <PolicySection heading="Who you are dealing with">
        <P>
          This site is operated by {contact.legalName}, a limited liability
          company licensed in Dubai and trading from{" "}
          {contact.address.oneLine}. In these terms &ldquo;we&rdquo; and
          &ldquo;FEEZEE&rdquo; mean that company, and &ldquo;you&rdquo; means
          the person placing the order.
        </P>
        <P>
          Placing an order — on the site, or on WhatsApp — means you accept
          these terms, our{" "}
          <PolicyLink href="/shipping-and-returns">
            shipping and returns policy
          </PolicyLink>{" "}
          and our{" "}
          <PolicyLink href="/privacy-policy">privacy policy</PolicyLink>. You
          must be 18 or older, and able to enter a contract, to order from us.
        </P>
      </PolicySection>

      <PolicySection heading="When the order becomes a contract">
        <P>
          Everything on the site is an invitation to order, not an offer. Your
          order is an offer to buy; the contract forms when we send you an order
          confirmation naming the pieces. Until then we may decline an order —
          if a size sold out between your basket and your checkout, if we cannot
          verify the payment or the delivery address, or if a price was listed
          in obvious error.
        </P>
        <P>
          Where we decline after taking payment, we refund it in full and we do
          not hold you to the mistaken price.
        </P>
      </PolicySection>

      <PolicySection heading="Prices, VAT and payment">
        <PolicyList
          items={[
            "All prices are in UAE dirhams (AED). Other currencies shown on the site are a guide converted for your convenience; the order is charged in dirhams.",
            <>
              Prices are shown before tax. UAE VAT at {vatPct}% is added at
              checkout, applied to the garments and to the delivery fee where
              one is charged, and both the tax and the total are itemised before
              you confirm anything.
            </>,
            "We take cards, bank transfer and cash on delivery. Card payments are handled by our payment provider; we never see or store your card number.",
            "Title in a garment passes to you on delivery. Risk passes to you at the same moment.",
          ]}
        />
        <P>
          A price shown on the site can change at any time. The price that binds
          us is the one on your order confirmation.
        </P>
      </PolicySection>

      <PolicySection heading="The garments themselves">
        <P>
          Our pieces are embroidered, printed and stitched largely by hand.
          Slight variation between one piece and the next — in the placement of
          an embroidered motif, in the exact register of a print — is a property
          of that work and not a fault. Colour on a screen depends on the
          screen; we photograph a garment as it is, but we cannot promise your
          display renders it as your eye would in the shop.
        </P>
        <P>
          Where a piece is genuinely faulty or is not what you ordered, your
          rights are set out in the{" "}
          <PolicyLink href="/shipping-and-returns">
            shipping and returns policy
          </PolicyLink>{" "}
          and are not limited by this section.
        </P>
      </PolicySection>

      <PolicySection heading="Delivery, cancellation and returns">
        <P>
          Delivery times, fees and the free-delivery threshold are set out in
          full on the{" "}
          <PolicyLink href="/shipping-and-returns">
            shipping and returns
          </PolicyLink>{" "}
          page and form part of these terms. Delivery dates are estimates in
          good faith, not guarantees; a courier delay is not a breach of this
          contract, though we will chase it on your behalf.
        </P>
        <P>
          You may cancel an order at no cost at any point before it is
          dispatched. After delivery you have {returnWindowDays} days to return
          an unworn piece with its tags attached, on the conditions set out in
          that policy.
        </P>

        <PolicyNote title="Made-to-measure work" tone="wine">
          <P>
            A Silai piece is cut to your own measurements and cannot be resold,
            so once the cloth is cut the order can no longer be cancelled or
            refunded. In exchange it carries free alterations for as long as you
            own it. This is the one exception on this page, it is stated here
            and on the returns page, and it does not apply to a piece that
            arrives faulty or cut against the measurements you gave us.
          </P>
        </PolicyNote>
      </PolicySection>

      <PolicySection heading="Your account">
        <P>
          You do not need an account to buy from us. If you open one, keep the
          password to yourself — you are responsible for what is done through
          it. Tell us at once if you think someone else has it, and we will
          close the sessions on it. We may suspend an account used for fraud, or
          to abuse the returns policy.
        </P>
      </PolicySection>

      <PolicySection heading="What belongs to us">
        <P>
          The FEEZEE name, the logo, the photography, the written descriptions
          and the design of this site are ours or are used under licence. You are
          welcome to share a link or a product photograph as a customer would.
          You may not reproduce our photography or copy for commercial use, list
          our pieces as your own, or scrape the catalogue, without our written
          permission.
        </P>
      </PolicySection>

      <PolicySection heading="What we are responsible for">
        <P>
          We are responsible for delivering the garment you ordered, in the
          condition described, and for the consequences of failing to. We are
          not responsible for losses neither of us could reasonably have
          foreseen when you ordered, nor for delays caused by events outside our
          control — a courier strike, a customs hold, a closure by order of the
          authorities.
        </P>
        <PolicyNote>
          <P>
            Nothing in these terms removes or reduces any right you have under
            UAE consumer protection law, including your rights in respect of
            faulty or misdescribed goods. Where a term here conflicts with those
            rights, those rights prevail.
          </P>
        </PolicyNote>
      </PolicySection>

      <PolicySection heading="Governing law">
        <P>
          These terms, and any dispute arising out of them or out of an order,
          are governed by the federal laws of the United Arab Emirates as
          applied in the Emirate of Dubai — among them the Consumer Protection
          Law (Federal Law No. 15 of 2020) and its executive regulations, the
          law on Trading by Modern Technological Means (Federal Decree-Law No.
          14 of 2023), and the VAT law (Federal Decree-Law No. 8 of 2017). The
          courts of Dubai have jurisdiction.
        </P>
        <P>
          Before it reaches a court, talk to us. Most of what ends up in a
          dispute is a parcel, a size or a seam, and those are settled faster on{" "}
          <PolicyLink href={`mailto:${contact.email}`}>email</PolicyLink> or
          WhatsApp than anywhere else. You may also raise a complaint with the
          UAE Ministry of Economy or the Dubai Department of Economy and
          Tourism.
        </P>
      </PolicySection>

      <PolicySection heading="Changes to these terms">
        <P>
          We may revise these terms; the date at the top of the page says when
          we last did. The terms that apply to your order are the ones published
          on the day you placed it, and a later change never applies backwards
          to an order already confirmed.
        </P>
      </PolicySection>
    </PolicyPage>
  );
}
