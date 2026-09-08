import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AccountShell,
  StatusPill,
  shortDate,
  statusLabel,
} from "@/app/account/account-shell";
import { currentUser } from "@/modules/customers";
import { returnsForUser } from "@/modules/returns";
import { formatPrice } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Your returns",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** The four stops a return passes through, for the little progress line. */
const STAGES = ["PENDING", "APPROVED", "RECEIVED", "REFUNDED"] as const;

export default async function AccountReturnsPage() {
  const user = await currentUser();
  if (!user) redirect("/account/login?next=/account/returns");

  const returns = await returnsForUser(user.id);

  return (
    <AccountShell
      current="/account/returns"
      title="Returns"
      name={user.name}
      standfirst="Start a return from the order it belongs to. Once it is open you can follow it here."
    >
      {returns.length === 0 ? (
        <p className="m-0 py-8 text-[15px] leading-[1.7] text-cocoa">
          You have not returned anything.{" "}
          <Link href="/account/orders" className="text-gold-dark hover:text-ink">
            Open an order
          </Link>{" "}
          to start one.
        </p>
      ) : (
        <ul className="m-0 p-0 list-none flex flex-col gap-5">
          {returns.map((request) => {
            const rejected = request.status === "REJECTED";
            const stageIndex = STAGES.indexOf(
              request.status as (typeof STAGES)[number],
            );

            return (
              <li key={request.id} className="border border-line p-[clamp(18px,2.4vw,26px)]">
                <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
                  <div>
                    <div className="text-[13px] tracking-[0.16em] uppercase text-ink">
                      {request.returnNumber}
                    </div>
                    <div className="mt-1 text-[12.5px] text-muted">
                      Order{" "}
                      <Link
                        href={`/account/orders/${request.orderId}`}
                        className="text-gold-dark hover:text-ink"
                      >
                        {request.orderNumber}
                      </Link>{" "}
                      · requested {shortDate(request.requestedAt)}
                    </div>
                  </div>
                  <StatusPill status={request.status} kind="return" />
                </div>

                {!rejected && (
                  <ol className="m-0 mt-5 p-0 list-none grid grid-cols-4 gap-1.5">
                    {STAGES.map((stage, i) => (
                      <li key={stage} className="flex flex-col gap-1.5">
                        <span
                          aria-hidden
                          className={`h-[3px] ${i <= stageIndex ? "bg-gold" : "bg-line"}`}
                        />
                        <span
                          className={`text-[11px] tracking-[0.12em] uppercase ${
                            i <= stageIndex ? "text-ink" : "text-muted"
                          }`}
                        >
                          {statusLabel(stage, "return")}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}

                <div className="mt-5 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <ul className="m-0 p-0 list-none flex flex-col gap-1 text-[13.5px] text-cocoa">
                    {request.items.map((item) => (
                      <li key={item.id}>
                        {item.quantity} × {item.productName} ({item.size})
                      </li>
                    ))}
                  </ul>

                  <div className="text-right">
                    <div className="text-[12px] tracking-[0.16em] uppercase text-muted">
                      {request.status === "REFUNDED" ? "Refunded" : "Expected refund"}
                    </div>
                    <div className="mt-1 text-[16px] font-medium text-ink">
                      {formatPrice(
                        request.refundAmountAed ?? request.suggestedRefundAed,
                      )}
                    </div>
                  </div>
                </div>

                <p className="m-0 mt-4 text-[13.5px] leading-[1.7] text-cocoa">
                  <span className="text-muted">Reason:</span> {request.reason}
                </p>

                {request.adminNotes && (
                  <p className="m-0 mt-2 bg-panel px-4 py-3 text-[13.5px] leading-[1.7] text-cocoa">
                    {request.adminNotes}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AccountShell>
  );
}
