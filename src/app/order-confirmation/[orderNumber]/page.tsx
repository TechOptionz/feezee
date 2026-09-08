import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/layout/page-frame";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { Values } from "@/components/sections/values";
import { WhatsAppIcon } from "@/components/ui/icons";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { currentUser } from "@/modules/customers";
import { orderByNumber } from "@/modules/orders";
import { formatUaePhone } from "@/modules/checkout";
import { bankDetails, bankTransferWhatsAppHref } from "@/modules/payments";
import { img } from "@/lib/assets";
import { formatPrice } from "@/lib/currency";
import { maskEmail, maskPhone } from "@/lib/mask";
import { siteHost, trackOrderPath, whatsappHref } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

/**
 * The receipt.
 *
 * Reachable by order number alone, with no sign-in — a guest has to be able to
 * come back to it from the email, and the number is unguessable enough for a
 * page that shows no payment details. What it deliberately does not do is
 * accept the `?paid=1` Stripe adds on the way back as proof of anything: only
 * the signed webhook marks an order paid.
 *
 * The contact details are the exception, and are shown in full only to a
 * viewer who has some claim to them: the signed-in owner, or anyone at all in
 * the hour after checkout, which is the window this page actually exists for
 * — the customer reading back the address they have just typed. After that
 * the street line, the phone and the email are redacted, so a guessed order
 * number pays out no more than `/track-order` would, and that page withholds
 * them entirely (see `TrackedOrder`). Unlike this one it is also throttled.
 */
/*
 * An hour is generous for reading a receipt and short enough that a number
 * scraped from a forwarded email months later is worth nothing. Read off the
 * clock outside the component: the page is `force-dynamic` so there is no
 * cached render to go stale, but a wall-clock read still does not belong in a
 * render body.
 */
const FULL_DETAIL_WINDOW_MS = 60 * 60 * 1000;

function placedRecently(placedAt: string): boolean {
  return Date.now() - new Date(placedAt).getTime() < FULL_DETAIL_WINDOW_MS;
}

export default async function OrderConfirmationPage({
  params,
}: PageProps<"/order-confirmation/[orderNumber]">) {
  const { orderNumber } = await params;
  const order = await orderByNumber(orderNumber);
  if (!order) notFound();

  const viewer = await currentUser();
  const showContactInFull =
    (viewer !== null && viewer.id === order.userId) || placedRecently(order.placedAt);

  const maskedPhone = maskPhone(order.customerPhone);

  const bank = bankDetails();
  const awaitingTransfer =
    order.paymentMethod === "BANK_TRANSFER" && order.paymentStatus === "PENDING";

  return (
    <PageFrame>
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(20px,3vw,40px)]">
        <Breadcrumb trail={["Order confirmed"]} />

        <p className="m-0 mt-[clamp(20px,3vw,34px)] flex items-center gap-3 text-[12.5px] tracking-[0.3em] uppercase text-muted">
          <span aria-hidden className="h-px w-[clamp(22px,3vw,40px)] bg-gold/70" />
          {order.fulfillmentStatus === "CANCELLED" ? "Cancelled" : "Thank you"}
        </p>

        <h1 className="mt-[clamp(8px,1.2vw,14px)] mb-0 font-display font-normal text-[clamp(32px,5vw,58px)] leading-[1.05] uppercase">
          Order {order.orderNumber}
        </h1>

        <p className="mt-[clamp(14px,1.8vw,20px)] mb-0 max-w-[62ch] text-[15.5px] leading-[1.7] text-cocoa">
          {order.fulfillmentStatus === "CANCELLED"
            ? "This order has been cancelled and the pieces are back on the rail."
            : `We have your order and a copy is on its way to ${showContactInFull ? order.customerEmail : maskEmail(order.customerEmail)}. We confirm every order on WhatsApp before it is dispatched.`}
        </p>

        {/*
          Above the payment instructions and the invoice, because it is the one
          thing on this page a customer comes back for a week from now — and
          because most FEEZEE orders are placed as a guest, for whom this number
          is the whole of their access to the order.
        */}
        {order.fulfillmentStatus !== "CANCELLED" && (
          <div className="mt-[clamp(24px,3vw,36px)] border border-gold/50 bg-panel px-[clamp(20px,3vw,30px)] py-[clamp(20px,2.6vw,28px)]">
            <h2 className="m-0 text-[12.5px] tracking-[0.22em] uppercase font-normal text-muted">
              Track your delivery
            </h2>

            <p className="m-0 mt-3 text-[14.5px] leading-[1.7] text-cocoa">
              Your order &amp; tracking reference
            </p>
            <p className="m-0 mt-1 font-display text-[clamp(26px,3.4vw,36px)] leading-[1.1] tracking-[0.06em] text-ink">
              {order.orderNumber}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href={trackOrderPath(order.orderNumber)}
                className="inline-flex items-center justify-center bg-ink text-cream hover:text-cream px-7 py-3.5 text-[12.5px] tracking-[0.16em] uppercase"
              >
                Track your delivery
              </Link>
              <span className="text-[13px] text-muted">
                Opens with this number already filled in.
              </span>
            </div>

            <p className="m-0 mt-5 max-w-[62ch] text-[14px] leading-[1.7] text-cocoa">
              <strong className="text-ink">Save this number.</strong> It is all
              you need — track your parcel any time at {siteHost}/track-order with
              this Order Number alone. No email, no account, no login.
            </p>
          </div>
        )}

        {/*
          Offered, never required. The wording has to make clear that an account
          adds convenience next time and nothing else — a guest's order, receipt
          and tracking already work exactly as a member's do.
        */}
        {!order.userId && order.fulfillmentStatus !== "CANCELLED" && (
          <p className="mt-4 m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 border border-line px-5 py-4 text-[14px] leading-[1.7] text-cocoa">
            <span>Want to save your details for your next order?</span>
            <Link
              href="/account/register"
              className="text-gold-dark hover:text-ink border-b border-current"
            >
              Create an optional account
            </Link>
            <span className="text-muted">
              — your order and tracking work exactly the same either way.
            </span>
          </p>
        )}

        {awaitingTransfer && bank.iban && (
          <div className="mt-[clamp(24px,3vw,36px)] border border-gold/40 bg-panel px-[clamp(20px,3vw,30px)] py-[clamp(20px,2.6vw,28px)]">
            <h2 className="m-0 text-[13px] tracking-[0.22em] uppercase font-normal">
              Complete your bank transfer
            </h2>
            <dl className="m-0 mt-4 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-[14.5px]">
              <dt className="text-muted">Account name</dt>
              <dd className="m-0 text-ink">{bank.accountName}</dd>
              <dt className="text-muted">Bank</dt>
              <dd className="m-0 text-ink">{bank.bankName}</dd>
              <dt className="text-muted">IBAN</dt>
              <dd className="m-0 text-ink font-medium tracking-[0.04em]">{bank.iban}</dd>
              <dt className="text-muted">Reference</dt>
              <dd className="m-0 text-ink">{order.orderNumber}</dd>
              <dt className="text-muted">Amount</dt>
              <dd className="m-0 text-ink font-medium">{formatPrice(order.totalAed)}</dd>
            </dl>
            <a
              href={bankTransferWhatsAppHref(order.orderNumber, order.totalAed)}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2.5 bg-ink text-cream hover:text-cream px-6 py-3.5 text-[12.5px] tracking-[0.16em] uppercase"
            >
              <WhatsAppIcon />
              Send your receipt
            </a>
          </div>
        )}

        {order.paymentMethod === "COD" && order.paymentStatus === "PENDING" && (
          <p className="mt-[clamp(24px,3vw,36px)] m-0 bg-panel px-5 py-4 text-[14.5px] leading-[1.7] text-cocoa">
            Have <strong className="text-ink">{formatPrice(order.totalAed)}</strong>{" "}
            ready for the rider. Payment is collected at the door.
          </p>
        )}

        <div className="mt-[clamp(28px,3.6vw,46px)]">
          <OrderTimeline order={order} />
        </div>

        <div className="mt-[clamp(28px,3.6vw,46px)] flex flex-wrap items-start gap-x-[clamp(28px,4vw,64px)] gap-y-10 pb-[clamp(30px,4vw,56px)]">
          <div className="flex-[1_1_400px] min-w-0">
            <h2 className="m-0 mb-4 text-[13px] tracking-[0.22em] uppercase font-normal border-b border-line pb-3">
              What you ordered
            </h2>
            <ul className="m-0 p-0 list-none">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 py-4 border-b border-line last:border-b-0"
                >
                  <div className="relative w-[70px] shrink-0 aspect-[4/5] bg-sand overflow-hidden">
                    {item.image && (
                      <Image
                        src={img(item.image)}
                        alt=""
                        fill
                        sizes="70px"
                        className="object-cover object-top"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <span className="text-[13px] tracking-[0.16em] uppercase text-ink">
                      {item.productName}
                    </span>
                    <span className="text-[12.5px] text-muted">
                      Size {item.variantSize}
                    </span>
                    <span className="text-[12.5px] text-muted">
                      {item.quantity} × {formatPrice(item.unitPriceAed)}
                    </span>
                  </div>
                  <span className="text-[14.5px] font-medium whitespace-nowrap">
                    {formatPrice(item.totalAed)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="flex-[1_1_300px] bg-panel p-[clamp(22px,3vw,34px)] flex flex-col gap-5">
            <div>
              <h2 className="m-0 mb-3 text-[13px] tracking-[0.22em] uppercase font-normal">
                Summary
              </h2>
              <dl className="m-0 flex flex-col gap-2.5 text-[14.5px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-cocoa">Subtotal</dt>
                  <dd className="m-0">{formatPrice(order.subtotalAed)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-cocoa">Delivery</dt>
                  <dd className="m-0">
                    {order.shippingFeeAed === 0
                      ? "Free"
                      : formatPrice(order.shippingFeeAed)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-cocoa">VAT (5%)</dt>
                  <dd className="m-0">{formatPrice(order.vatAed)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-line pt-3">
                  <dt className="text-[13px] tracking-[0.14em] uppercase self-center">
                    Total
                  </dt>
                  <dd className="m-0 text-[17px] font-medium">
                    {formatPrice(order.totalAed)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-line pt-4">
              <h3 className="m-0 mb-2 text-[12px] tracking-[0.2em] uppercase text-muted font-normal">
                Delivering to
              </h3>
              <address className="not-italic text-[14px] leading-[1.7] text-cocoa">
                <span className="text-ink">{order.customerName}</span>
                <br />
                {/* The street line is the detail worth protecting, so it is
                    dropped rather than starred out — a partial address is
                    still an address. */}
                {showContactInFull && (
                  <>
                    {order.shippingAddressLine}
                    <br />
                  </>
                )}
                {order.shippingCity}, {order.shippingEmirate}
                {(showContactInFull || maskedPhone) && <br />}
                {showContactInFull
                  ? formatUaePhone(order.customerPhone)
                  : maskedPhone}
              </address>

              {!showContactInFull && (
                <p className="m-0 mt-3 text-[12.5px] leading-[1.6] text-muted">
                  Your full address and contact details are hidden.{" "}
                  <Link href="/account/orders" className="border-b border-current">
                    Sign in
                  </Link>{" "}
                  to see them.
                </p>
              )}
            </div>

            <a
              href={whatsappHref(
                `Hello FEEZEE, I have a question about order ${order.orderNumber}.`,
              )}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2.5 border border-line text-ink hover:text-ink px-6 py-3.5 text-[12.5px] tracking-[0.16em] uppercase"
            >
              <WhatsAppIcon />
              Ask about this order
            </a>

            <Link
              href="/new-in"
              className="text-center text-[12.5px] tracking-[0.14em] uppercase text-gold-dark hover:text-ink"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      </div>

      <Values />
    </PageFrame>
  );
}
