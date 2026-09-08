import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AccountShell, StatusPill, shortDate } from "@/app/account/account-shell";
import { ReturnRequestForm } from "@/app/account/returns/return-form";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { WhatsAppIcon } from "@/components/ui/icons";
import { currentUser } from "@/modules/customers";
import { orderById } from "@/modules/orders";
import { checkEligibility } from "@/modules/returns";
import { formatUaePhone } from "@/modules/checkout";
import { img } from "@/lib/assets";
import { formatPrice } from "@/lib/currency";
import { whatsappHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountOrderPage({
  params,
}: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect(`/account/login?next=/account/orders/${id}`);

  const order = await orderById(id);
  // Scoped to the signed-in customer: a guessed order id belonging to someone
  // else is a 404, not a peek at their address.
  if (!order || order.userId !== user.id) notFound();

  const eligibility = await checkEligibility(order.id);

  return (
    <AccountShell
      current="/account/orders"
      title={order.orderNumber}
      name={user.name}
      standfirst={`Placed ${shortDate(order.placedAt)}.`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill status={order.fulfillmentStatus} kind="fulfilment" />
        <StatusPill status={order.paymentStatus} kind="payment" />
        <span className="text-[13px] text-muted">
          {order.paymentMethod === "COD"
            ? "Cash on delivery"
            : order.paymentMethod === "BANK_TRANSFER"
              ? "Bank transfer"
              : "Card"}
        </span>
      </div>

      <div className="mt-[clamp(26px,3.4vw,40px)]">
        <OrderTimeline order={order} />
      </div>

      <div className="mt-[clamp(28px,3.6vw,46px)] flex flex-wrap items-start gap-x-[clamp(28px,4vw,64px)] gap-y-10">
        <section className="flex-[1_1_400px] min-w-0">
          <h2 className="m-0 mb-3 text-[13px] tracking-[0.22em] uppercase font-normal border-b border-line pb-3">
            Pieces
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

          {order.returns.length > 0 && (
            <div className="mt-6 border border-line p-5">
              <h3 className="m-0 mb-3 text-[12px] tracking-[0.2em] uppercase text-muted font-normal">
                Returns on this order
              </h3>
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {order.returns.map((ret) => (
                  <li
                    key={ret.id}
                    className="flex flex-wrap items-center justify-between gap-3 text-[14px]"
                  >
                    <span className="text-ink">{ret.returnNumber}</span>
                    <StatusPill status={ret.status} kind="return" />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {eligibility.eligible ? (
            <div className="mt-8">
              <h2 className="m-0 mb-3 text-[13px] tracking-[0.22em] uppercase font-normal border-b border-line pb-3">
                Request a return
              </h2>
              <p className="m-0 mb-4 text-[14px] leading-[1.7] text-cocoa">
                {eligibility.daysLeft}{" "}
                {eligibility.daysLeft === 1 ? "day" : "days"} left of your return
                window.
              </p>
              <ReturnRequestForm
                orderId={order.id}
                items={order.items.map((item) => ({
                  id: item.id,
                  productName: item.productName,
                  variantSize: item.variantSize,
                  quantity: item.quantity,
                }))}
              />
            </div>
          ) : (
            <p className="mt-8 m-0 bg-panel px-5 py-4 text-[14px] leading-[1.7] text-cocoa">
              {eligibility.reason}
            </p>
          )}
        </section>

        <aside className="flex-[1_1_300px] bg-panel p-[clamp(22px,3vw,32px)] flex flex-col gap-5">
          <div>
            <h2 className="m-0 mb-3 text-[13px] tracking-[0.22em] uppercase font-normal">
              Summary
            </h2>
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

          <div className="border-t border-line pt-4">
            <h3 className="m-0 mb-2 text-[12px] tracking-[0.2em] uppercase text-muted font-normal">
              Delivered to
            </h3>
            <address className="not-italic text-[14px] leading-[1.7] text-cocoa">
              <span className="text-ink">{order.customerName}</span>
              <br />
              {order.shippingAddressLine}
              <br />
              {order.shippingCity}, {order.shippingEmirate}
              <br />
              {formatUaePhone(order.customerPhone)}
            </address>
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
            ← All orders
          </Link>
        </aside>
      </div>
    </AccountShell>
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
