import type { Metadata } from "next";
import Link from "next/link";
import { FulfillmentStatus, PaymentStatus } from "@/generated/prisma/enums";
import {
  AdminHeading,
  AdminPill,
  EmptyRow,
  Panel,
  TableWrap,
  Td,
  Th,
  adminDate,
} from "@/app/admin/admin-ui";
import { requireStaff } from "@/modules/admin";
import { listOrders } from "@/modules/orders";
import { EMIRATES } from "@/modules/checkout";
import { formatPrice } from "@/lib/currency";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

export default async function AdminOrdersPage({
  searchParams,
}: PageProps<"/admin/orders">) {
  await requireStaff("/admin/orders");

  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const payment = typeof params.payment === "string" ? params.payment : "";
  const emirate = typeof params.emirate === "string" ? params.emirate : "";
  const q = typeof params.q === "string" ? params.q : "";
  const page = Math.max(1, Number(params.page) || 1);

  const { orders, total } = await listOrders({
    fulfillmentStatus: Object.values(FulfillmentStatus).includes(
      status as FulfillmentStatus,
    )
      ? (status as FulfillmentStatus)
      : undefined,
    paymentStatus: Object.values(PaymentStatus).includes(payment as PaymentStatus)
      ? (payment as PaymentStatus)
      : undefined,
    emirate: emirate || undefined,
    search: q || undefined,
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const query = (next: Record<string, string | number>) => {
    const search = new URLSearchParams();
    if (status) search.set("status", status);
    if (payment) search.set("payment", payment);
    if (emirate) search.set("emirate", emirate);
    if (q) search.set("q", q);
    for (const [key, value] of Object.entries(next)) search.set(key, String(value));
    return `/admin/orders?${search.toString()}`;
  };

  return (
    <>
      <AdminHeading
        title="Orders"
        standfirst="Every order the shop has taken. Open one to move it along, add a courier, or cancel it and put the pieces back."
      />

      <Panel>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
              Search
            </span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Order, name, email or phone"
              className="min-w-[240px] border border-ink-line bg-transparent px-3 py-2.5 text-[14px] text-champagne outline-none placeholder:text-taupe focus:border-gold"
            />
          </label>

          <Filter label="Fulfilment" name="status" value={status} options={Object.values(FulfillmentStatus)} />
          <Filter label="Payment" name="payment" value={payment} options={Object.values(PaymentStatus)} />
          <Filter label="Emirate" name="emirate" value={emirate} options={[...EMIRATES]} />

          <button
            type="submit"
            className="cursor-pointer border border-ink-border bg-transparent px-5 py-2.5 text-[11.5px] tracking-[0.16em] uppercase text-sandstone hover:border-champagne hover:text-champagne"
          >
            Filter
          </button>

          {(q || status || payment || emirate) && (
            <Link
              href="/admin/orders"
              className="pb-2.5 text-[11.5px] tracking-[0.14em] uppercase text-taupe hover:text-champagne"
            >
              Clear
            </Link>
          )}
        </form>
      </Panel>

      <div className="mt-4">
        <Panel title={`${total} ${total === 1 ? "order" : "orders"}`}>
          <TableWrap>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Placed</Th>
                  <Th>Customer</Th>
                  <Th>Where</Th>
                  <Th>Payment</Th>
                  <Th>Fulfilment</Th>
                  <Th align="right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <EmptyRow span={7}>No orders match that.</EmptyRow>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <Td>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-champagne hover:text-gold-light"
                        >
                          {order.orderNumber}
                        </Link>
                        <span className="block text-[11.5px] text-taupe">
                          {order.items.reduce((n, i) => n + i.quantity, 0)} pieces
                        </span>
                      </Td>
                      <Td>{adminDate(order.placedAt)}</Td>
                      <Td>
                        <span className="block text-champagne">{order.customerName}</span>
                        <span className="block text-[11.5px] text-taupe">
                          {order.customerEmail}
                        </span>
                      </Td>
                      <Td>
                        {order.shippingCity}
                        <span className="block text-[11.5px] text-taupe">
                          {order.shippingEmirate}
                        </span>
                      </Td>
                      <Td>
                        <AdminPill status={order.paymentStatus} />
                        <span className="mt-1 block text-[11.5px] text-taupe">
                          {order.paymentMethod === "COD"
                            ? "Cash"
                            : order.paymentMethod === "BANK_TRANSFER"
                              ? "Transfer"
                              : "Card"}
                        </span>
                      </Td>
                      <Td>
                        <AdminPill status={order.fulfillmentStatus} />
                      </Td>
                      <Td align="right">{formatPrice(order.totalAed)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrap>

          {pages > 1 && (
            <div className="mt-5 flex items-center justify-between gap-4 text-[12px] tracking-[0.14em] uppercase">
              {page > 1 ? (
                <Link href={query({ page: page - 1 })} className="text-gold-light hover:text-champagne">
                  ← Previous
                </Link>
              ) : (
                <span className="text-taupe/50">← Previous</span>
              )}
              <span className="text-taupe">
                Page {page} of {pages}
              </span>
              {page < pages ? (
                <Link href={query({ page: page + 1 })} className="text-gold-light hover:text-champagne">
                  Next →
                </Link>
              ) : (
                <span className="text-taupe/50">Next →</span>
              )}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function Filter({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value}
        className="border border-ink-line bg-ink px-3 py-2.5 text-[14px] text-champagne outline-none focus:border-gold"
      >
        <option value="">Any</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.toLowerCase().replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
