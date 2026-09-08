"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { trackOrderAction } from "@/app/actions/track-order";
import {
  IDLE_TRACK,
  type TrackState,
} from "@/app/actions/track-order-state";
import { OrderTimeline } from "@/components/orders/order-timeline";
import {
  FormMessage,
  SubmitButton,
  TextField,
} from "@/components/forms/form-kit";
import { WhatsAppIcon } from "@/components/ui/icons";
import { img } from "@/lib/assets";
import { formatPrice } from "@/lib/currency";
import { whatsappHref } from "@/lib/site";

/**
 * Two fields and, once they match, the parcel.
 *
 * The order number is the whole of what is asked for. The email field stays,
 * and is checked when it is filled in, but nothing depends on it — someone
 * reading the number off a printed receipt or a WhatsApp message should not
 * have to also remember which address they checked out with.
 *
 * The lookup itself is a POST to a server action rather than a GET whose answer
 * sits in the URL: the result carries a name and an invoice, and those do not
 * belong in a link that can be forwarded. The *question* arrives by GET, since
 * both emails link straight here — `?order=<the order number>` — and the effect below
 * runs the lookup on arrival, so a tap in the email lands on the parcel rather
 * than on a form. Nothing personal is in that URL now that the email is not
 * required for it.
 *
 * The params are read once, into state, rather than off `useSearchParams` on
 * every render: `window.history` updates sync back into that hook, and a later
 * change to it must not reach back and rewrite fields the customer has since
 * typed into.
 *
 * The result renders under the form rather than replacing it, so someone
 * checking a second parcel does not have to find their way back.
 */
export function TrackOrderForm() {
  const [state, action] = useActionState<TrackState, FormData>(
    trackOrderAction,
    IDLE_TRACK,
  );

  const searchParams = useSearchParams();
  const [prefill] = useState(() => ({
    orderNumber: searchParams.get("order")?.trim() ?? "",
    email: searchParams.get("email")?.trim() ?? "",
  }));

  const formRef = useRef<HTMLFormElement>(null);
  const autoRan = useRef(false);

  /*
   * Arriving with an order number runs the lookup itself. Submitting the real
   * form rather than calling the action by hand means the pending state, the
   * validation and the error path are all the ones a typed submission gets —
   * there is no second code path to keep in step. Guarded by a ref so React's
   * development double-invoke does not look the order up twice.
   */
  useEffect(() => {
    if (autoRan.current) return;
    if (!prefill.orderNumber) return;
    autoRan.current = true;
    formRef.current?.requestSubmit();
  }, [prefill]);

  return (
    <div className="flex flex-col gap-[clamp(28px,4vw,48px)]">
      <form
        ref={formRef}
        action={action}
        className="flex flex-col gap-5 border border-line bg-panel p-[clamp(22px,3.4vw,38px)] max-w-[560px]"
      >
        <FormMessage
          state={{
            status: state.status === "error" ? "error" : "idle",
            message: state.message,
          }}
        />

        <TextField
          label="Order number"
          name="orderNumber"
          required
          autoComplete="off"
          spellCheck={false}
          /* A template rather than a specimen: a well-formed order number is
             the whole credential for this page, so one printed on it would be
             an invitation to try it. */
          placeholder="FZ-00-0000-XXXX"
          defaultValue={state.values?.orderNumber ?? prefill.orderNumber}
          error={state.fieldErrors?.orderNumber}
          hint="Printed at the top of your order confirmation email. This is all we need."
        />

        <TextField
          label="Email address (optional)"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.values?.email ?? prefill.email}
          error={state.fieldErrors?.email}
          hint="Only needed for a few older orders — we will say so if yours is one."
        />

        <SubmitButton pendingLabel="Looking…" className="self-start">
          Track my order
        </SubmitButton>
      </form>

      {state.status === "found" && state.order && <Result order={state.order} />}
    </div>
  );
}

function Result({ order }: { order: NonNullable<TrackState["order"]> }) {
  const placed = new Date(order.placedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section
      aria-live="polite"
      className="border-t border-line pt-[clamp(26px,3.4vw,40px)]"
    >
      <p className="m-0 flex items-center gap-3 text-[12.5px] tracking-[0.3em] uppercase text-muted">
        <span aria-hidden className="h-px w-[clamp(22px,3vw,40px)] bg-gold/70" />
        Placed {placed}
      </p>

      <h2 className="mt-[clamp(8px,1.2vw,14px)] mb-0 font-display font-normal text-[clamp(24px,3.4vw,40px)] leading-[1.1] uppercase">
        Order {order.orderNumber}
      </h2>

      <p className="mt-3 mb-0 max-w-[62ch] text-[15px] leading-[1.7] text-cocoa">
        {order.customerName} — {order.shippingCity}, {order.shippingEmirate}.
      </p>

      <div className="mt-[clamp(26px,3.4vw,42px)]">
        <OrderTimeline order={order} />
      </div>

      {/* The courier panel only exists once there is a parcel to point at. */}
      {order.courierName && order.fulfillmentStatus !== "CANCELLED" && (
        <div className="mt-[clamp(24px,3vw,34px)] flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border border-gold/40 bg-panel px-[clamp(18px,2.6vw,28px)] py-[clamp(16px,2.2vw,22px)]">
          <div>
            <div className="text-[12px] tracking-[0.2em] uppercase text-muted">
              Carried by
            </div>
            <div className="mt-1.5 text-[16px] text-ink">{order.courierName}</div>
            {order.trackingNumber && (
              <div className="mt-1 text-[13.5px] text-cocoa tabular-nums">
                {order.trackingNumber}
              </div>
            )}
            {order.courierTransit && (
              <div className="mt-1 text-[12.5px] text-muted">
                {order.courierTransit}
              </div>
            )}
          </div>

          {order.trackingUrl && (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center bg-ink text-cream hover:text-cream px-7 py-3.5 text-[12.5px] tracking-[0.16em] uppercase"
            >
              Track the parcel
            </a>
          )}
        </div>
      )}

      <div className="mt-[clamp(28px,3.6vw,46px)] flex flex-wrap items-start gap-x-[clamp(28px,4vw,64px)] gap-y-10">
        <div className="flex-[1_1_400px] min-w-0">
          <h3 className="m-0 mb-4 text-[13px] tracking-[0.22em] uppercase font-normal border-b border-line pb-3">
            In the parcel
          </h3>
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

        <aside className="flex-[1_1_280px] bg-panel p-[clamp(22px,3vw,32px)] flex flex-col gap-5">
          <div>
            <h3 className="m-0 mb-3 text-[13px] tracking-[0.22em] uppercase font-normal">
              Summary
            </h3>
            <dl className="m-0 flex flex-col gap-2.5 text-[14.5px]">
              <Row label="Subtotal" value={formatPrice(order.subtotalAed)} />
              <Row
                label="Delivery"
                value={
                  order.shippingFeeAed === 0
                    ? "Free"
                    : formatPrice(order.shippingFeeAed)
                }
              />
              <Row label="VAT (5%)" value={formatPrice(order.vatAed)} />
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
            href="/account/orders"
            className="text-center text-[12.5px] tracking-[0.14em] uppercase text-gold-dark hover:text-ink"
          >
            Sign in for all your orders
          </Link>
        </aside>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-cocoa">{label}</dt>
      <dd className="m-0">{value}</dd>
    </div>
  );
}
