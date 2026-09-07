import type { Metadata } from "next";
import Link from "next/link";
import { ReturnStatus } from "@prisma/client";
import { AdminHeading, AdminPill, Panel, adminDate } from "@/app/admin/admin-ui";
import { ReturnActions } from "@/app/admin/returns/return-actions";
import { requireStaff } from "@/modules/admin";
import { listReturns } from "@/modules/returns";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Returns" };
export const dynamic = "force-dynamic";

export default async function AdminReturnsPage({
  searchParams,
}: PageProps<"/admin/returns">) {
  await requireStaff("/admin/returns");

  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const filter = Object.values(ReturnStatus).includes(status as ReturnStatus)
    ? (status as ReturnStatus)
    : undefined;

  const returns = await listReturns(filter);

  return (
    <>
      <AdminHeading
        title="Returns"
        standfirst="The refund and the restock are separate decisions — a piece that comes back damaged is still refunded, but it does not go back on the rail."
      />

      <div className="mb-4 flex flex-wrap gap-1">
        <Tab href="/admin/returns" label="All" active={!filter} />
        {Object.values(ReturnStatus).map((option) => (
          <Tab
            key={option}
            href={`/admin/returns?status=${option}`}
            label={option.toLowerCase()}
            active={filter === option}
          />
        ))}
      </div>

      {returns.length === 0 ? (
        <Panel>
          <p className="m-0 py-10 text-center text-[14px] text-taupe">
            No returns {filter ? `marked ${filter.toLowerCase()}` : "yet"}.
          </p>
        </Panel>
      ) : (
        <div className="flex flex-col gap-4">
          {returns.map((request) => (
            <Panel key={request.id}>
              <div className="grid grid-cols-1 wide:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[14px] text-champagne">
                        {request.returnNumber}
                      </div>
                      <div className="mt-1 text-[12px] text-taupe">
                        <Link
                          href={`/admin/orders?q=${encodeURIComponent(request.orderNumber)}`}
                          className="text-taupe hover:text-gold-light"
                        >
                          {request.orderNumber}
                        </Link>{" "}
                        · {request.customerName} · {adminDate(request.requestedAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AdminPill status={request.status} />
                      {request.isRestocked && (
                        <span className="border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] tracking-[0.14em] uppercase text-gold-light">
                          restocked
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="m-0 mt-4 p-0 list-none flex flex-col gap-1.5 text-[13.5px] text-sandstone">
                    {request.items.map((item) => (
                      <li key={item.id}>
                        {item.quantity} × {item.productName}{" "}
                        <span className="text-taupe">({item.size})</span>{" "}
                        <span className="text-taupe tabular-nums">
                          {formatPrice(item.unitPriceAed * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className="m-0 mt-4 text-[13.5px] leading-[1.7] text-sandstone">
                    <span className="text-taupe">Reason:</span> {request.reason}
                  </p>
                  {request.customerNotes && (
                    <p className="m-0 mt-2 border-l-2 border-ink-border pl-3 text-[13px] leading-[1.7] text-taupe">
                      {request.customerNotes}
                    </p>
                  )}

                  <p className="m-0 mt-4 text-[13.5px] text-sandstone">
                    <span className="text-taupe">
                      {request.status === "REFUNDED" ? "Refunded:" : "Full refund would be:"}
                    </span>{" "}
                    <span className="text-champagne tabular-nums">
                      {formatPrice(
                        request.refundAmountAed ?? request.suggestedRefundAed,
                      )}
                    </span>
                  </p>
                </div>

                <div className="border-t border-ink-line pt-5 wide:border-l wide:border-t-0 wide:pl-6 wide:pt-0">
                  <ReturnActions
                    returnId={request.id}
                    status={request.status}
                    suggestedRefundAed={request.suggestedRefundAed}
                    isRestocked={request.isRestocked}
                    adminNotes={request.adminNotes}
                  />
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}

function Tab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "border px-3.5 py-2 text-[11.5px] tracking-[0.14em] uppercase transition-colors",
        active
          ? "border-gold text-champagne hover:text-champagne"
          : "border-ink-line text-taupe hover:border-ink-border hover:text-champagne",
      )}
    >
      {label}
    </Link>
  );
}
