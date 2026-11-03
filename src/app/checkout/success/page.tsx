import type { Metadata } from "next";
import Link from "next/link";
import { PageFrame } from "@/components/layout/page-frame";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { orderByNumber } from "@/modules/orders";
import { stripeSessionOrderNumber } from "@/modules/payments";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

/** `cs_test_…` / `cs_live_…` — anything else is not worth a call to Stripe. */
const SESSION_ID = /^cs_(?:test|live)_[A-Za-z0-9]{10,255}$/;

/**
 * Where Stripe sends the customer after paying.
 *
 * It reads and never writes. Arriving here proves only that someone has the
 * URL, so the order's payment status shown is whatever the signed webhook has
 * recorded — which, for a card, is usually already PAID by the time the page
 * renders, and otherwise follows a few seconds later.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: PageProps<"/checkout/success">) {
  const { session_id } = await searchParams;
  const sessionId = typeof session_id === "string" ? session_id : "";

  let orderNumber: string | null = null;
  if (SESSION_ID.test(sessionId)) {
    try {
      orderNumber = await stripeSessionOrderNumber(sessionId);
    } catch (error) {
      console.warn(
        "[checkout] could not read Stripe session",
        error instanceof Error ? error.message : error,
      );
    }
  }

  const order = orderNumber ? await orderByNumber(orderNumber) : null;
  const paid = order?.paymentStatus === "PAID";

  return (
    <PageFrame>
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(20px,3vw,40px)] pb-[clamp(40px,7vw,90px)]">
        <Breadcrumb trail={["Order confirmed"]} />

        <p className="m-0 mt-[clamp(20px,3vw,34px)] flex items-center gap-3 text-[12.5px] tracking-[0.3em] uppercase text-muted">
          <span aria-hidden className="h-px w-[clamp(22px,3vw,40px)] bg-gold/70" />
          Thank you
        </p>

        <h1 className="mt-[clamp(8px,1.2vw,14px)] mb-0 font-display font-normal text-[clamp(32px,5vw,58px)] leading-[1.05] uppercase">
          {order ? `Order ${order.orderNumber}` : "Order confirmed"}
        </h1>

        <p className="mt-[clamp(14px,1.8vw,20px)] mb-0 max-w-[62ch] text-[15.5px] leading-[1.7] text-cocoa">
          {!order
            ? "Thank you — your payment has gone through to Stripe. Your receipt is on its way by email, and we confirm every order on WhatsApp before it is dispatched."
            : paid
              ? "Your payment is confirmed and your order is with the workshop. A receipt is on its way by email, and we confirm every order on WhatsApp before it is dispatched."
              : "We have your order and are confirming the payment with Stripe — this usually takes a few seconds. Your receipt will show it as paid once it does."}
        </p>

        {order && (
          <div className="mt-[clamp(24px,3vw,36px)] flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href={`/order-confirmation/${order.orderNumber}`}
              className="inline-flex items-center justify-center bg-ink text-cream hover:text-cream px-7 py-3.5 text-[12.5px] tracking-[0.16em] uppercase"
            >
              View your receipt
            </Link>
            <Link
              href="/new-in"
              className="text-[13px] tracking-[0.18em] uppercase underline underline-offset-4"
            >
              Continue shopping
            </Link>
          </div>
        )}
      </div>
    </PageFrame>
  );
}
