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
} from "@/app/admin/admin-ui";
import { DateRangeTabs, rangeFromParams } from "@/app/admin/date-range";
import { RevenueChart } from "@/app/admin/revenue-chart";
import { requireStaff } from "@/modules/admin";
import {
  metrics,
  revenueSeries,
  salesByCollection,
  topSellers,
} from "@/modules/reporting";
import { formatPrice } from "@/lib/currency";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function AdminReportsPage({
  searchParams,
}: PageProps<"/admin/reports">) {
  await requireStaff("/admin/reports");

  const params = await searchParams;
  const { range, preset, from, to } = rangeFromParams({
    range: typeof params.range === "string" ? params.range : undefined,
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined,
  });

  const [kpis, series, byCollection, sellers] = await Promise.all([
    metrics(range),
    revenueSeries(range),
    salesByCollection(range),
    topSellers(range, 15),
  ]);

  // The CSV routes take the resolved dates, so a preset and a custom range both
  // export exactly what is on screen.
  const dates = `from=${range.from.toISOString().slice(0, 10)}&to=${range.to.toISOString().slice(0, 10)}`;

  return (
    <>
      <AdminHeading
        title="Reports"
        standfirst="The same figures as the dashboard, with everything downloadable. CSVs open in Excel as UTF-8, so dirham amounts and Arabic names come through intact."
      />

      <DateRangeTabs preset={preset} from={from} to={to} basePath="/admin/reports" />

      <div className="mt-[clamp(20px,2.6vw,30px)] grid grid-cols-2 nav:grid-cols-3 wide:grid-cols-5 gap-3">
        <StatCard label="Gross revenue" value={formatPrice(kpis.grossRevenueAed)} />
        <StatCard label="Net collected" value={formatPrice(kpis.netRevenueAed)} />
        <StatCard label="VAT collected" value={formatPrice(kpis.vatCollectedAed)} />
        <StatCard label="Orders" value={String(kpis.orderCount)} />
        <StatCard
          label="Average order"
          value={formatPrice(kpis.averageOrderValueAed)}
        />
      </div>

      <div className="mt-4">
        <Panel title="Downloads">
          <div className="flex flex-wrap gap-3">
            <Download
              href={`/admin/reports/download/orders?${dates}`}
              title="Orders"
              note="Every order in the range, with VAT, delivery and tracking."
            />
            <Download
              href={`/admin/reports/download/sales?${dates}`}
              title="Sales"
              note="Daily takings and the split by line."
            />
            <Download
              href="/admin/reports/download/inventory"
              title="Inventory"
              note="Every size, its SKU and what is on the rail right now."
            />
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="Revenue">
          <RevenueChart series={series} />
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 wide:grid-cols-2 gap-4">
        <Panel title="By line">
          <TableWrap>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Line</Th>
                  <Th align="right">Pieces</Th>
                  <Th align="right">Revenue</Th>
                </tr>
              </thead>
              <tbody>
                {byCollection.length === 0 ? (
                  <EmptyRow span={3}>Nothing sold in this range.</EmptyRow>
                ) : (
                  byCollection.map((slice) => (
                    <tr key={slice.collection}>
                      <Td>{slice.collection}</Td>
                      <Td align="right">{slice.units}</Td>
                      <Td align="right">{formatPrice(slice.revenueAed)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrap>
        </Panel>

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
                      <Td>{row.productName}</Td>
                      <Td align="right">{row.units}</Td>
                      <Td align="right">{formatPrice(row.revenueAed)}</Td>
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

function Download({
  href,
  title,
  note,
}: {
  href: string;
  title: string;
  note: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex-1 min-w-[220px] border border-ink-line p-4 text-sandstone hover:border-gold hover:text-sandstone"
    >
      <span className="block text-[13px] tracking-[0.16em] uppercase text-champagne">
        {title} CSV ↓
      </span>
      <span className="mt-2 block text-[12.5px] leading-[1.6] text-taupe">
        {note}
      </span>
    </Link>
  );
}
