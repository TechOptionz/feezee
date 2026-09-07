import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminHeading,
  AdminPill,
  Panel,
  adminDateTime,
} from "@/app/admin/admin-ui";
import { FulfilmentPanel } from "@/app/admin/orders/[id]/fulfilment-panel";
import { requireStaff } from "@/modules/admin";
import { nextStatuses, orderById } from "@/modules/orders";
import { courierNames } from "@/modules/shipping";
import { formatUaePhone } from "@/modules/checkout";
import { img } from "@/lib/assets";
import { formatPrice } from "@/lib/currency";
import { whatsappHref } from "@/lib/site";

export const metadata: Metadata = { title: "Order" };
export const dynamic = "force-dynamic";

export default async function AdminOrderPage({
  params,
}: PageProps<"/admin/orders/[id]">) {
  await requireStaff("/admin/orders");

  const { id } = await params;
  const order = await orderById(id);
  if (!order) notFound();

  return (
    <>
      <AdminHeading
        title={order.orderNumber}
        standfirst={`Placed ${adminDateTime(order.placedAt)} · ${order.items.reduce((n, i) => n + i.quantity, 0)} pieces`}
        action={
          <Link
            href="/admin/orders"
            className="border border-ink-border px-5 py-2.5 text-[11.5px] tracking-[0.16em] uppercase text-sandstone hover:border-champagne hover:text-champagne"
          >
            ← All orders
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <AdminPill status={order.fulfillmentStatus} />
        <AdminPill status={order.paymentStatus} />
        <span className="text-[12.5px] tracking-[0.14em] uppercase text-taupe">
          {order.paymentMethod === "COD"
            ? "Cash on delivery"
            : order.paymentMethod === "BANK_TRANSFER"
              ? "Bank transfer"
              : "Card / Apple Pay"}
        </span>
      </div>

      <div className="grid grid-cols-1 wide:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
        <div className="flex flex-col gap-4">
          <Panel title="Pieces">
            <ul className="m-0 p-0 list-none">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 border-b border-ink-line/60 py-3.5 last:border-b-0"
                >
                  <div className="relative h-[64px] w-[50px] shrink-0 overflow-hidden bg-ink-line">
                    {item.image && (
                      <Image
                        src={img(item.image)}
                        alt=""
                        fill
                        sizes="50px"
                        className="object-cover object-top"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] text-champagne">{item.productName}</div>
                    <div className="mt-1 text-[12px] text-taupe">
                      Size {item.variantSize} · {item.sku}
                    </div>
                    <div className="mt-1 text-[12.5px] text-sandstone">
                      {item.quantity} × {formatPrice(item.unitPriceAed)}
                    </div>
                  </div>
                  <div className="whitespace-nowrap text-[14px] text-champagne tabular-nums">
                    {formatPrice(item.totalAed)}
                  </div>
                </li>
              ))}
            </ul>

            <dl className="m-0 mt-5 flex flex-col gap-2 border-t border-ink-line pt-4 text-[13.5px]">
              <Row label="Subtotal" value={formatPrice(order.subtotalAed)} />
              <Row
                label="Delivery"
                value={
                  order.shippingFeeAed === 0 ? "Free" : formatPrice(order.shippingFeeAed)
                }
              />
              <Row label="VAT (5%)" value={formatPrice(order.vatAed)} />
              <div className="flex justify-between gap-4 border-t border-ink-line pt-3">
                <dt className="text-[11.5px] tracking-[0.16em] uppercase text-taupe self-center">
                  Total
                </dt>
                <dd className="m-0 text-[17px] text-champagne tabular-nums">
                  {formatPrice(order.totalAed)}
                </dd>
              </div>
            </dl>
          </Panel>

          {order.transactions.length > 0 && (
            <Panel title="Payment history">
              <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
                {order.transactions.map((transaction) => (
                  <li
                    key={transaction.id}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-ink-line/60 pb-2.5 last:border-b-0 last:pb-0 text-[13px]"
                  >
                    <span className="text-sandstone">
                      {transaction.provider}
                      {transaction.transactionId && (
                        <span className="ml-2 text-taupe">
                          {transaction.transactionId.slice(0, 24)}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-3">
                      <AdminPill status={transaction.status} />
                      <span className="text-taupe">
                        {adminDateTime(transaction.createdAt)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {order.returns.length > 0 && (
            <Panel title="Returns">
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {order.returns.map((ret) => (
                  <li
                    key={ret.id}
                    className="flex flex-wrap items-center justify-between gap-3 text-[13.5px]"
                  >
                    <Link
                      href="/admin/returns"
                      className="text-champagne hover:text-gold-light"
                    >
                      {ret.returnNumber}
                    </Link>
                    <AdminPill status={ret.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Fulfilment">
            <FulfilmentPanel
              orderId={order.id}
              current={order.fulfillmentStatus}
              paymentStatus={order.paymentStatus}
              allowed={nextStatuses(order.fulfillmentStatus)}
              couriers={courierNames()}
              courierName={order.courierName}
              trackingNumber={order.trackingNumber}
            />
          </Panel>

          <Panel title="Customer">
            <div className="flex flex-col gap-3 text-[13.5px] leading-[1.7]">
              <div>
                <div className="text-champagne">{order.customerName}</div>
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="text-sandstone hover:text-gold-light break-all"
                >
                  {order.customerEmail}
                </a>
                <div>
                  <a
                    href={whatsappHref(
                      `Hello ${order.customerName}, about your FEEZEE order ${order.orderNumber}…`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sandstone hover:text-gold-light"
                  >
                    {formatUaePhone(order.customerPhone)}
                  </a>
                </div>
              </div>

              <div className="border-t border-ink-line pt-3">
                <div className="mb-1.5 text-[11px] tracking-[0.16em] uppercase text-taupe">
                  Delivering to
                </div>
                <address className="not-italic text-sandstone">
                  {order.shippingAddressLine}
                  <br />
                  {order.shippingCity}, {order.shippingEmirate}
                  {order.shippingLandmark && (
                    <>
                      <br />
                      <span className="text-taupe">Near {order.shippingLandmark}</span>
                    </>
                  )}
                </address>
              </div>

              {order.shippingNotes && (
                <div className="border-t border-ink-line pt-3">
                  <div className="mb-1.5 text-[11px] tracking-[0.16em] uppercase text-taupe">
                    Note from the customer
                  </div>
                  <p className="m-0 text-sandstone">{order.shippingNotes}</p>
                </div>
              )}

              {order.trackingNumber && (
                <div className="border-t border-ink-line pt-3">
                  <div className="mb-1.5 text-[11px] tracking-[0.16em] uppercase text-taupe">
                    Tracking
                  </div>
                  <p className="m-0 text-sandstone">
                    {order.courierName} · {order.trackingNumber}
                  </p>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[12.5px] text-gold-light hover:text-champagne"
                    >
                      Open tracking ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-taupe">{label}</dt>
      <dd className="m-0 text-sandstone tabular-nums">{value}</dd>
    </div>
  );
}
