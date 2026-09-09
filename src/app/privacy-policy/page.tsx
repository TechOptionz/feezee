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
import { contact } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What FEEZEE SILAI FASHION L.L.C collects when you shop with us, why we hold it, who we share it with, and the rights you have over it under UAE law.",
  alternates: { canonical: "/privacy-policy" },
};

/**
 * What the shop knows about a customer, said plainly.
 *
 * Written against the UAE Personal Data Protection Law, and deliberately
 * specific: the cookies are named, the processors are named, and the one
 * unusual thing a tailor holds — your measurements — is called out rather than
 * folded into "personal information". A privacy notice that could describe any
 * shop describes nothing.
 */

const UPDATED = "9 September 2026";

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      eyebrow="Your information"
      standfirst="We are a clothes shop, not a data business. We collect what it takes to cut a garment, deliver it and be able to answer for it afterwards — and nothing we hold is ever sold."
      updated={UPDATED}
    >
      <PolicySection heading="Who holds your information">
        <P>
          {contact.legalName}, at {contact.address.oneLine}, is the controller
          of the personal data described here. This notice is written against
          the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of
          2021) and applies to feezee.ae, to orders placed on WhatsApp, and to
          measurements taken in the shop at Madina Mall.
        </P>
      </PolicySection>

      <PolicySection heading="What we collect">
        <PolicyRows
          rows={[
            {
              term: "To reach you",
              detail:
                "Your name, mobile number, email address and delivery address.",
            },
            {
              term: "To fill the order",
              detail:
                "The pieces and sizes you bought, the order's history, and any notes you sent with it.",
            },
            {
              term: "To cut a Silai piece",
              detail:
                "The body measurements you give us, and the fitting notes our tailors add. Held for the piece, and kept afterwards only so a later order can be cut to the same block.",
            },
            {
              term: "To take payment",
              detail:
                "The method, the amount and whether it succeeded. Card numbers are entered on our payment provider's own form and never reach FEEZEE.",
            },
            {
              term: "From your browser",
              detail:
                "Pages requested, approximate location by IP, and the device and browser you used — the ordinary server and analytics record every website keeps.",
            },
          ]}
        />
        <P>
          If you have an account, we also hold your sign-in email and a hashed
          password. We never see the password itself, and neither does anyone
          working here.
        </P>
      </PolicySection>

      <PolicySection heading="Why we hold it">
        <PolicyList
          items={[
            <>
              <strong className="font-normal text-ink">To perform our contract with you</strong> —
              cutting, packing, delivering, taking payment, handling a return.
              Without this we cannot sell you anything.
            </>,
            <>
              <strong className="font-normal text-ink">To meet a legal obligation</strong> —
              invoices and tax records, which UAE law requires us to keep and
              produce on request.
            </>,
            <>
              <strong className="font-normal text-ink">For our legitimate interests</strong> —
              keeping the shop secure, preventing fraudulent orders, and
              understanding which pages are used so the site can be improved.
            </>,
            <>
              <strong className="font-normal text-ink">With your consent</strong> — the newsletter,
              and nothing else. You can withdraw it at any time and it costs you
              nothing else on this list.
            </>,
          ]}
        />
        <PolicyNote>
          <P>
            We do not sell personal data, we do not trade it, and we do not use
            it to target advertising anywhere on or off this site.
          </P>
        </PolicyNote>
      </PolicySection>

      <PolicySection heading="Who else sees it">
        <P>
          Only the companies that make an order work, and each of them sees only
          the part they need.
        </P>
        <PolicyRows
          rows={[
            {
              term: "Couriers",
              detail:
                "Aramex, Emirates Post, Fetchr, DHL Express and our own Dubai rider — your name, address and phone number, to hand you the parcel.",
            },
            {
              term: "Payment provider",
              detail:
                "Stripe, for card payments. Your card details are given to Stripe directly and are processed under their own terms.",
            },
            {
              term: "Email delivery",
              detail:
                "Resend, which sends the order, dispatch and return emails on our behalf.",
            },
            {
              term: "Hosting and analytics",
              detail:
                "Vercel, which runs the site and provides the aggregate traffic figures we use to improve it.",
            },
            {
              term: "Authorities",
              detail:
                "Where the law requires it — a court order, a tax audit, or a lawful request we are obliged to answer.",
            },
          ]}
        />
        <P>
          Some of these process data on servers outside the UAE. Where they do,
          we rely on the safeguards the Personal Data Protection Law requires
          for a transfer of that kind.
        </P>
      </PolicySection>

      <PolicySection heading="Cookies and what your browser stores">
        <P>
          We set no advertising cookies and run no third-party ad trackers. What
          the site does set is this:
        </P>
        <PolicyRows
          rows={[
            {
              term: "feezee_session",
              detail:
                "Keeps you signed in. Encrypted and unreadable by the page itself, so a script cannot lift it.",
            },
            {
              term: "feezee_scope",
              detail:
                "An opaque id that keeps one person's bag separate from another's on a shared laptop. It identifies nobody on its own.",
            },
            {
              term: "feezee_staff",
              detail:
                "Set only for shop staff, so the admin bar appears. It grants nothing — every staff action is re-checked on the server.",
            },
            {
              term: "Local storage",
              detail:
                "Your bag and wishlist, kept in your own browser so they survive a refresh. They never leave your device until you check out.",
            },
          ]}
        />
        <P>
          Clearing your browser&rsquo;s site data removes all of it. Your bag and
          wishlist go with it, and your orders do not — those are ours to keep
          under the section below.
        </P>
      </PolicySection>

      <PolicySection heading="How long we keep it">
        <PolicyList
          items={[
            "Orders and invoices: for the period UAE tax law requires records to be kept — five years from the end of the tax period they fall in.",
            "Silai measurements: while you are a customer, so a repeat order can be cut to the same block. Ask us and we will delete them sooner.",
            "Account details: until you close the account, then removed except where an order record must survive it.",
            "Newsletter address: until you unsubscribe.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="Your rights">
        <P>
          Under the Personal Data Protection Law you may ask us to do any of the
          following, and we answer within 30 days at no charge:
        </P>
        <PolicyList
          items={[
            "Tell you what we hold about you, and give you a copy of it.",
            "Correct anything that is wrong or out of date.",
            "Delete what we hold, where no legal obligation requires us to keep it.",
            "Stop or restrict a particular use — marketing, for instance, or automated processing.",
            "Hand your data to you, or to another business, in a portable form.",
            "Withdraw a consent you gave, without that affecting anything you have already been sent.",
          ]}
        />
        <P>
          Write to{" "}
          <PolicyLink href={`mailto:${contact.email}`}>{contact.email}</PolicyLink>{" "}
          or use the WhatsApp number below. If you are not satisfied with how we
          answer, you may complain to the UAE Data Office.
        </P>
      </PolicySection>

      <PolicySection heading="Keeping it safe">
        <P>
          Passwords are hashed, the session cookie is signed and unreadable by
          the page, card details never touch our servers, and access to the
          admin is limited to named staff whose every action against an order or
          a price is written to an audit log. No system is perfect; if a breach
          ever affects your data we will tell you and the regulator, as the law
          requires.
        </P>
      </PolicySection>

      <PolicySection heading="Children">
        <P>
          The shop is not directed at children, and we do not knowingly collect
          data from anyone under 18. If you believe a child has given us
          information, tell us and we will remove it.
        </P>
      </PolicySection>

      <PolicySection heading="Changes to this notice">
        <P>
          When this notice changes, the date at the top of the page changes with
          it. A change that materially affects how we use what we already hold
          will be told to you directly, not left here to be found.
        </P>
      </PolicySection>
    </PolicyPage>
  );
}
