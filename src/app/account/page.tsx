import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountShell, StatusPill, shortDate } from "@/app/account/account-shell";
import { currentUser, listAddresses } from "@/modules/customers";
import { ordersForUser } from "@/modules/orders";
import { formatUaePhone } from "@/modules/checkout";
import { formatPrice } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/account/login?next=/account");

  const [orders, addresses] = await Promise.all([
    ordersForUser(user.id),
    listAddresses(user.id),
  ]);

  const recent = orders.slice(0, 3);
  const primary = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  const lifetime = orders
    .filter((o) => o.fulfillmentStatus !== "CANCELLED")
    .reduce((sum, o) => sum + o.totalAed, 0);

  return (
    <AccountShell current="/account" title="Overview" name={user.name}>
      <div className="grid grid-cols-1 nav:grid-cols-3 gap-5">
        <Stat label="Orders" value={String(orders.length)} />
        <Stat label="Lifetime spend" value={formatPrice(lifetime)} />
        <Stat label="Saved addresses" value={String(addresses.length)} />
      </div>

      <div className="mt-[clamp(28px,3.6vw,46px)] flex flex-wrap items-start gap-x-[clamp(28px,4vw,64px)] gap-y-10">
        <section className="flex-[1_1_420px] min-w-0">
          <h2 className="m-0 mb-4 flex items-baseline justify-between gap-4 text-[13px] tracking-[0.22em] uppercase font-normal border-b border-line pb-3">
            Recent orders
            {orders.length > 3 && (
              <Link
                href="/account/orders"
                className="text-[12px] text-gold-dark hover:text-ink"
              >
                See all
              </Link>
            )}
          </h2>

          {recent.length === 0 ? (
            <p className="m-0 py-6 text-[15px] leading-[1.7] text-cocoa">
              Nothing ordered yet.{" "}
              <Link href="/new-in" className="text-gold-dark hover:text-ink">
                The new season is here
              </Link>
              .
            </p>
          ) : (
            <ul className="m-0 p-0 list-none">
              {recent.map((order) => (
                <li key={order.id} className="border-b border-line last:border-b-0">
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 py-4 text-ink hover:text-ink"
                  >
                    <span className="flex flex-col gap-1">
                      <span className="text-[13px] tracking-[0.16em] uppercase">
                        {order.orderNumber}
                      </span>
                      <span className="text-[12.5px] text-muted">
                        {shortDate(order.placedAt)} · {order.items.length}{" "}
                        {order.items.length === 1 ? "piece" : "pieces"}
                      </span>
                    </span>
                    <span className="flex items-center gap-4">
                      <StatusPill status={order.fulfillmentStatus} />
                      <span className="text-[14.5px] font-medium whitespace-nowrap">
                        {formatPrice(order.totalAed)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex-[1_1_280px] bg-panel p-[clamp(22px,3vw,32px)]">
          <h2 className="m-0 mb-3 text-[13px] tracking-[0.22em] uppercase font-normal">
            Delivery address
          </h2>
          {primary ? (
            <address className="not-italic text-[14.5px] leading-[1.75] text-cocoa">
              <span className="text-ink">{primary.fullName}</span>
              <br />
              {primary.addressLine1}
              {primary.addressLine2 && (
                <>
                  <br />
                  {primary.addressLine2}
                </>
              )}
              <br />
              {primary.city}, {primary.emirate}
              <br />
              {formatUaePhone(primary.phone)}
            </address>
          ) : (
            <p className="m-0 text-[14.5px] leading-[1.7] text-cocoa">
              No address saved yet.
            </p>
          )}
          <Link
            href="/account/addresses"
            className="mt-4 inline-block text-[12px] tracking-[0.16em] uppercase text-gold-dark hover:text-ink border-b border-current pb-0.5"
          >
            {primary ? "Manage addresses" : "Add an address"} →
          </Link>
        </section>
      </div>
    </AccountShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line p-[clamp(18px,2.4vw,26px)]">
      <div className="text-[12px] tracking-[0.2em] uppercase text-muted">{label}</div>
      <div className="mt-2 font-display text-[clamp(24px,3vw,34px)] leading-none text-ink">
        {value}
      </div>
    </div>
  );
}
