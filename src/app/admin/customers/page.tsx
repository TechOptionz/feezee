import type { Metadata } from "next";
import Link from "next/link";
import {
  AdminHeading,
  EmptyRow,
  Panel,
  StatCard,
  TableWrap,
  Td,
  Th,
  adminDate,
} from "@/app/admin/admin-ui";
import { requireStaff } from "@/modules/admin";
import { customerDirectory } from "@/modules/customers";
import { formatUaePhone } from "@/modules/checkout";
import { formatPrice } from "@/lib/currency";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: PageProps<"/admin/customers">) {
  await requireStaff("/admin/customers");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const customers = await customerDirectory(q || undefined);

  const withOrders = customers.filter((c) => c.orderCount > 0);
  const lifetime = customers.reduce((sum, c) => sum + c.totalSpentAed, 0);
  const repeat = customers.filter((c) => c.orderCount > 1).length;

  return (
    <>
      <AdminHeading
        title="Customers"
        standfirst="Everyone with an account, biggest spender first. Guest orders are not here — find those under Orders."
      />

      <div className="grid grid-cols-2 nav:grid-cols-4 gap-3">
        <StatCard label="Accounts" value={String(customers.length)} />
        <StatCard label="Have ordered" value={String(withOrders.length)} />
        <StatCard label="Ordered more than once" value={String(repeat)} />
        <StatCard label="Lifetime value" value={formatPrice(lifetime)} />
      </div>

      <div className="mt-4">
        <Panel>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
                Search
              </span>
              <input
                name="q"
                defaultValue={q}
                placeholder="Name or email"
                className="min-w-[240px] border border-ink-line bg-transparent px-3 py-2.5 text-[14px] text-champagne outline-none placeholder:text-taupe focus:border-gold"
              />
            </label>
            <button
              type="submit"
              className="cursor-pointer border border-ink-border bg-transparent px-5 py-2.5 text-[11.5px] tracking-[0.16em] uppercase text-sandstone hover:border-champagne hover:text-champagne"
            >
              Search
            </button>
            {q && (
              <Link
                href="/admin/customers"
                className="pb-2.5 text-[11.5px] tracking-[0.14em] uppercase text-taupe hover:text-champagne"
              >
                Clear
              </Link>
            )}
          </form>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title={`${customers.length} ${customers.length === 1 ? "account" : "accounts"}`}>
          <TableWrap>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Customer</Th>
                  <Th>Phone</Th>
                  <Th>Joined</Th>
                  <Th>Last order</Th>
                  <Th align="right">Orders</Th>
                  <Th align="right">Spent</Th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <EmptyRow span={6}>No accounts match that.</EmptyRow>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id}>
                      <Td>
                        <Link
                          href={`/admin/orders?q=${encodeURIComponent(customer.email)}`}
                          className="text-champagne hover:text-gold-light"
                        >
                          {customer.name}
                        </Link>
                        <span className="block text-[11.5px] text-taupe">
                          {customer.email}
                        </span>
                      </Td>
                      <Td>
                        {customer.phone ? formatUaePhone(customer.phone) : "—"}
                      </Td>
                      <Td>{adminDate(customer.createdAt)}</Td>
                      <Td>
                        {customer.lastOrderAt ? adminDate(customer.lastOrderAt) : "—"}
                      </Td>
                      <Td align="right">{customer.orderCount}</Td>
                      <Td align="right">{formatPrice(customer.totalSpentAed)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      </div>
    </>
  );
}
