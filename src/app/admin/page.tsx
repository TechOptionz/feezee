import type { Metadata } from "next";
import Link from "next/link";
import {
  AdminHeading,
  AdminPill,
  Panel,
  StatCard,
  Td,
  TableWrap,
  Th,
  EmptyRow,
  adminDate,
} from "@/app/admin/admin-ui";
import { DateRangeTabs, rangeFromParams } from "@/app/admin/date-range";
import { RevenueChart } from "@/app/admin/revenue-chart";
import { requireStaff } from "@/modules/admin";
import {
  metrics,
  revenueSeries,
  salesByCollection,
  topSellers,
  lowStockVariants,
} from "@/modules/reporting";
import { listOrders } from "@/modules/orders";
import { formatPrice } from "@/lib/currency";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: PageProps<"/admin">) {
  await requireStaff("/admin");

  const params = await searchParams;
  const { range, preset, from, to } = rangeFromParams({
    range: typeof params.range === "string" ? params.range : undefined,
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined,
  });

  const [kpis, series, byCollection, sellers, lowStock, recent] = await Promise.all([
    metrics(range),
    revenueSeries(range),
    salesByCollection(range),
    topSellers(range, 6),
    lowStockVariants(8),
    listOrders({ take: 6 }),
  ]);

  const collectionTotal = byCollection.reduce((sum, s) => sum + s.revenueAed, 0);

  return (
    <>
      <AdminHeading
        title="Dashboard"
        standfirst="Everything the shop did in the chosen range. Gross counts every order that was not cancelled; net counts only what has actually been collected."
      />

      <DateRangeTabs preset={preset} from={from} to={to} />

      <div className="mt-[clamp(20px,2.6vw,30px)] grid grid-cols-2 nav:grid-cols-3 wide:grid-cols-6 gap-3">
        <StatCard label="Gross revenue" value={formatPrice(kpis.grossRevenueAed)} />
        <StatCard
          label="Net collected"
          value={formatPrice(kpis.netRevenueAed)}
          hint={`${formatPrice(kpis.vatCollectedAed)} VAT`}
        />
        <StatCard
          label="Orders"
          value={String(kpis.orderCount)}
          hint={`${kpis.itemsSold} pieces`}
        />
        <StatCard
          label="Average order"
          value={formatPrice(kpis.averageOrderValueAed)}
        />
        <StatCard
          label="Pending orders"
          value={String(kpis.pendingOrders)}
          href="/admin/orders?status=PENDING"
          tone={kpis.pendingOrders > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Low stock"
          value={String(kpis.lowStockCount)}
          hint={kpis.openReturns > 0 ? `${kpis.openReturns} open returns` : undefined}
          href="/admin/inventory"
          tone={kpis.lowStockCount > 0 ? "warn" : "default"}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 wide:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
        <Panel title="Revenue">
          <RevenueChart series={series} />
        </Panel>

        <Panel title="By line">
          {byCollection.length === 0 ? (
            <p className="m-0 py-8 text-center text-[14px] text-taupe">
              Nothing sold in this range.
            </p>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-4">
              {byCollection.map((slice) => (
                <li key={slice.collection}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[13.5px] text-sandstone">
                      {slice.collection}
                    </span>
                    <span className="text-[13.5px] text-champagne tabular-nums">
                      {formatPrice(slice.revenueAed)}
                    </span>
                  </div>
                  <div className="mt-2 h-[5px] bg-ink-line">
                    <div
                      className="h-full bg-gold/70"
                      style={{
                        width: `${collectionTotal ? (slice.revenueAed / collectionTotal) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1.5 text-[11.5px] text-taupe">
                    {slice.units} {slice.units === 1 ? "piece" : "pieces"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 wide:grid-cols-2 gap-4">
        <Panel title="Best sellers">
          <TableWrap>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Piece</Th>
                  <Th align="right">Sold</Th>
                  <Th align="right">Revenue</Th>
                </tr>
              </thead>
              <tbody>
                {sellers.length === 0 ? (
                  <EmptyRow span={3}>Nothing sold in this range.</EmptyRow>
                ) : (
                  sellers.map((row) => (
                    <tr key={row.productName}>
                      <Td>
                        <span className="text-champagne">{row.productName}</span>
                      </Td>
                      <Td align="right">{row.units}</Td>
                      <Td align="right">{formatPrice(row.revenueAed)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrap>
        </Panel>

        <Panel
          title="Running out"
          action={
            <Link
              href="/admin/inventory"
              className="text-[11.5px] tracking-[0.14em] uppercase text-gold-light hover:text-champagne"
            >
              Restock →
            </Link>
          }
        >
          <TableWrap>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Piece</Th>
                  <Th>Size</Th>
                  <Th align="right">Left</Th>
                </tr>
              </thead>
              <tbody>
                {lowStock.length === 0 ? (
                  <EmptyRow span={3}>Every size is comfortably stocked.</EmptyRow>
                ) : (
                  lowStock.map((row) => (
                    <tr key={row.variantId}>
                      <Td>
                        <Link
                          href={`/admin/inventory?q=${encodeURIComponent(row.productName)}`}
                          className="text-champagne hover:text-gold-light"
                        >
                          {row.productName}
                        </Link>
                      </Td>
                      <Td>{row.size}</Td>
                      <Td align="right">
                        <span className={row.stock === 0 ? "text-wine-bright" : "text-sandstone"}>
                          {row.stock === 0 ? "Sold out" : row.stock}
                        </span>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          title="Latest orders"
          action={
            <Link
              href="/admin/orders"
              className="text-[11.5px] tracking-[0.14em] uppercase text-gold-light hover:text-champagne"
            >
              All orders →
            </Link>
          }
        >
          <TableWrap>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Emirate</Th>
                  <Th>Placed</Th>
                  <Th>Status</Th>
                  <Th align="right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {recent.orders.length === 0 ? (
                  <EmptyRow span={6}>No orders yet.</EmptyRow>
                ) : (
                  recent.orders.map((order) => (
                    <tr key={order.id}>
                      <Td>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-champagne hover:text-gold-light"
                        >
                          {order.orderNumber}
                        </Link>
                      </Td>
                      <Td>{order.customerName}</Td>
                      <Td>{order.shippingEmirate}</Td>
                      <Td>{adminDate(order.placedAt)}</Td>
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
        </Panel>
      </div>
    </>
  );
}
