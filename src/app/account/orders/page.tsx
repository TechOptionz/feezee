import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountShell, StatusPill, shortDate } from "@/app/account/account-shell";
import { currentUser } from "@/modules/customers";
import { ordersForUser } from "@/modules/orders";
import { formatPrice } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const user = await currentUser();
  if (!user) redirect("/account/login?next=/account/orders");

  const orders = await ordersForUser(user.id);

  return (
    <AccountShell
      current="/account/orders"
      title="Orders"
      name={user.name}
      standfirst="Every order you have placed, newest first. Open one for its tracking and to start a return."
    >
      {orders.length === 0 ? (
        <p className="m-0 py-8 text-[15px] leading-[1.7] text-cocoa">
          You have not ordered anything yet.{" "}
          <Link href="/new-in" className="text-gold-dark hover:text-ink">
            Shop New In
          </Link>
          .
        </p>
      ) : (
        <ul className="m-0 p-0 list-none border-t border-line">
          {orders.map((order) => (
            <li key={order.id} className="border-b border-line">
              <Link
                href={`/account/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5 text-ink hover:text-ink"
              >
                <span className="flex flex-col gap-1.5 min-w-0">
                  <span className="text-[13px] tracking-[0.16em] uppercase">
                    {order.orderNumber}
                  </span>
                  <span className="text-[12.5px] text-muted">
                    {shortDate(order.placedAt)} ·{" "}
                    {order.items.reduce((n, i) => n + i.quantity, 0)} pieces ·{" "}
                    {order.shippingEmirate}
                  </span>
                  <span className="text-[12.5px] text-muted truncate max-w-[46ch]">
                    {order.items.map((i) => i.productName).join(", ")}
                  </span>
                </span>

                <span className="flex items-center gap-4 shrink-0">
                  <StatusPill status={order.fulfillmentStatus} />
                  <span className="text-[15px] font-medium whitespace-nowrap">
                    {formatPrice(order.totalAed)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
