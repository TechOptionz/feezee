import { orderTimeline, type OrderView } from "@/modules/orders";
import { cn } from "@/lib/utils";

/**
 * Where the parcel has got to, as five stops on a line.
 *
 * A cancelled order is not drawn as a broken progress bar — it is a different
 * thing that happened, so it gets a sentence instead of a track with four
 * greyed-out steps on it.
 */
export function OrderTimeline({ order }: { order: OrderView }) {
  if (order.fulfillmentStatus === "CANCELLED") {
    return (
      <div className="border border-line bg-panel px-5 py-4 text-[14.5px] leading-[1.7] text-cocoa">
        This order was cancelled
        {order.cancelledAt
          ? ` on ${new Date(order.cancelledAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}`
          : ""}
        . Every piece went back on the rail.
      </div>
    );
  }

  const steps = orderTimeline(order);

  return (
    <div>
      <ol className="m-0 p-0 list-none grid gap-y-5 grid-cols-1 sm:grid-cols-5 sm:gap-x-2">
        {steps.map((step, i) => {
          const isCurrent =
            step.done && !steps[i + 1]?.done;

          return (
            <li key={step.label} className="flex sm:flex-col gap-3 sm:gap-2.5">
              {/* The rule and the dot. On a phone the track runs down the left
                  of the words; from `sm` it runs across above them. */}
              <div className="flex sm:w-full flex-col sm:flex-row items-center gap-0 sm:gap-0 shrink-0">
                <span
                  aria-hidden
                  className={cn(
                    "hidden sm:block h-px flex-1",
                    i === 0 ? "bg-transparent" : step.done ? "bg-gold" : "bg-line",
                  )}
                />
                <span
                  aria-hidden
                  className={cn(
                    "w-[11px] h-[11px] rounded-full shrink-0 border",
                    step.done
                      ? isCurrent
                        ? "bg-gold border-gold"
                        : "bg-ink border-ink"
                      : "bg-cream border-line",
                  )}
                />
                <span
                  aria-hidden
                  className={cn(
                    "hidden sm:block h-px flex-1",
                    i === steps.length - 1
                      ? "bg-transparent"
                      : steps[i + 1]?.done
                        ? "bg-gold"
                        : "bg-line",
                  )}
                />
                <span
                  aria-hidden
                  className={cn(
                    "sm:hidden w-px flex-1 min-h-6",
                    steps[i + 1]?.done ? "bg-gold" : "bg-line",
                    i === steps.length - 1 && "bg-transparent",
                  )}
                />
              </div>

              <div className="sm:text-center pb-2 sm:pb-0">
                <div
                  className={cn(
                    "text-[12.5px] tracking-[0.12em] uppercase",
                    step.done ? "text-ink" : "text-muted",
                  )}
                >
                  {step.label}
                </div>
                {step.at && (
                  <div className="mt-1 text-[12px] text-muted">
                    {new Date(step.at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {order.trackingNumber && (
        <p className="mt-6 mb-0 text-[14px] leading-[1.7] text-cocoa">
          {order.courierName} · {order.trackingNumber}
          {order.trackingUrl && (
            <>
              {" — "}
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-gold-dark border-b border-current"
              >
                Track your parcel
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}
