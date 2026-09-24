import type { OrderView } from "@/modules/orders";
import { formatUaePhone } from "@/modules/checkout";
import { contact, siteHost } from "@/lib/site";
import { maskPhone } from "@/lib/mask";

/**
 * The paper version of an order.
 *
 * Invisible on screen (`hidden print:block`) and the only thing on the page
 * once the print stylesheet in `globals.css` has hidden everything else, so
 * `window.print()` from either the customer's receipt or the back office
 * produces the same formal A4 document: the shop's legal name, TRN and
 * Madina Mall address, the order, the customer, the pieces, and the totals
 * with VAT broken out.
 *
 * `kind` decides the heading and what else is printed. A customer's copy is
 * a tax invoice and nothing more. The staff copy is also the packing slip:
 * it adds SKUs, the courier line, the customer's delivery note and a
 * picked / checked strip for whoever packs the parcel.
 *
 * `redactContact` mirrors the receipt page's own rule — after the first hour
 * an unauthenticated viewer sees no street line or full phone number on
 * screen, and the printed copy must not hand them out either.
 */
export function PrintInvoice({
  order,
  kind,
  redactContact = false,
}: {
  order: OrderView;
  kind: "receipt" | "packing";
  redactContact?: boolean;
}) {
  const pieces = order.items.reduce((n, item) => n + item.quantity, 0);
  const title = kind === "packing" ? "Packing Slip / Tax Invoice" : "Tax Invoice";
  const trn = contact.trn || "—";

  return (
    <section
      aria-hidden="true"
      className="hidden print:block bg-white text-black font-body text-[11pt] leading-[1.5]"
    >
      {/* Letterhead */}
      <header className="flex items-start justify-between gap-8 border-b-2 border-black pb-5">
        <div>
          <div className="font-display text-[26pt] leading-none tracking-[0.22em] uppercase">
            FEEZEE
          </div>
          <div className="mt-2 text-[11pt] font-medium uppercase tracking-[0.08em]">
            {contact.legalName}
          </div>
          <address className="mt-1.5 not-italic text-[9.5pt] leading-[1.55]">
            {contact.address.lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            <span className="block">
              WhatsApp {contact.whatsapp.display} · {contact.email}
            </span>
            <span className="block">{siteHost}</span>
          </address>
          <div className="mt-2 text-[10pt] font-medium">TRN: {trn}</div>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-display text-[16pt] uppercase leading-[1.1] tracking-[0.1em] whitespace-nowrap">
            {title}
          </div>
          <dl className="mt-3 grid grid-cols-[auto_auto] justify-end gap-x-4 gap-y-1 text-[10pt]">
            <dt className="text-neutral-600">Invoice / Order No.</dt>
            <dd className="m-0 font-medium">{order.orderNumber}</dd>
            <dt className="text-neutral-600">Date</dt>
            <dd className="m-0">{invoiceDate(order.placedAt)}</dd>
            <dt className="text-neutral-600">Payment method</dt>
            <dd className="m-0">{paymentMethodLabel(order.paymentMethod)}</dd>
            <dt className="text-neutral-600">Payment status</dt>
            <dd className="m-0">{titleCase(order.paymentStatus)}</dd>
            {kind === "packing" && (
              <>
                <dt className="text-neutral-600">Fulfilment</dt>
                <dd className="m-0">{titleCase(order.fulfillmentStatus)}</dd>
              </>
            )}
          </dl>
        </div>
      </header>

      {/* Parties */}
      <div className="mt-6 grid grid-cols-2 gap-8 text-[10pt]">
        <div>
          <div className="mb-1.5 text-[8.5pt] uppercase tracking-[0.2em] text-neutral-600">
            Bill to / Deliver to
          </div>
          <address className="not-italic leading-[1.6]">
            <span className="block font-medium">{order.customerName}</span>
            {!redactContact && <span className="block">{order.shippingAddressLine}</span>}
            <span className="block">
              {order.shippingCity}, {order.shippingEmirate}, United Arab Emirates
            </span>
            {order.shippingLandmark && !redactContact && (
              <span className="block">Near {order.shippingLandmark}</span>
            )}
            <span className="block">
              {redactContact
                ? maskPhone(order.customerPhone)
                : formatUaePhone(order.customerPhone)}
            </span>
            {!redactContact && <span className="block">{order.customerEmail}</span>}
          </address>
        </div>

        <div>
          <div className="mb-1.5 text-[8.5pt] uppercase tracking-[0.2em] text-neutral-600">
            Supplier
          </div>
          <div className="leading-[1.6]">
            <span className="block font-medium">{contact.legalName}</span>
            <span className="block">{contact.address.oneLine}</span>
            <span className="block">TRN {trn}</span>
          </div>
          {kind === "packing" && (
            <div className="mt-4">
              <div className="mb-1.5 text-[8.5pt] uppercase tracking-[0.2em] text-neutral-600">
                Courier
              </div>
              <div className="leading-[1.6]">
                {order.courierName ? (
                  <>
                    <span className="block">{order.courierName}</span>
                    {order.trackingNumber && (
                      <span className="block">Tracking {order.trackingNumber}</span>
                    )}
                  </>
                ) : (
                  <span className="block text-neutral-600">Not yet dispatched</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Line items */}
      <table className="mt-7 w-full border-collapse text-[10pt]">
        <thead>
          <tr className="border-b border-black text-[8.5pt] uppercase tracking-[0.16em] text-neutral-600">
            <th scope="col" className="py-2 pr-3 text-left font-normal">
              #
            </th>
            <th scope="col" className="py-2 pr-3 text-left font-normal">
              Product
            </th>
            {kind === "packing" && (
              <th scope="col" className="py-2 pr-3 text-left font-normal">
                SKU
              </th>
            )}
            <th scope="col" className="py-2 pr-3 text-left font-normal">
              Size
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-normal">
              Qty
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-normal">
              Unit price (AED)
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              Total (AED)
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={item.id} className="border-b border-neutral-300 align-top">
              <td className="py-2 pr-3 tabular-nums text-neutral-600">{index + 1}</td>
              <td className="py-2 pr-3">{item.productName}</td>
              {kind === "packing" && (
                <td className="py-2 pr-3 text-[9pt] text-neutral-600">{item.sku}</td>
              )}
              <td className="py-2 pr-3">{item.variantSize}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{item.quantity}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{money(item.unitPriceAed)}</td>
              <td className="py-2 text-right tabular-nums">{money(item.totalAed)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-5 flex items-start justify-between gap-8">
        <div className="text-[9.5pt] text-neutral-600">
          {pieces} {pieces === 1 ? "piece" : "pieces"}
          {kind === "packing" && order.shippingNotes && (
            <div className="mt-3 max-w-[60ch] text-black">
              <div className="mb-1 text-[8.5pt] uppercase tracking-[0.2em] text-neutral-600">
                Note from the customer
              </div>
              {order.shippingNotes}
            </div>
          )}
        </div>

        <dl className="m-0 w-[72mm] text-[10pt]">
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-neutral-600">Subtotal</dt>
            <dd className="m-0 tabular-nums">AED {money(order.subtotalAed)}</dd>
          </div>
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-neutral-600">Courier shipping fee</dt>
            <dd className="m-0 tabular-nums">
              {order.shippingFeeAed === 0 ? "Free" : `AED ${money(order.shippingFeeAed)}`}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-neutral-600">VAT (5% UAE)</dt>
            <dd className="m-0 tabular-nums">AED {money(order.vatAed)}</dd>
          </div>
          <div className="mt-1 flex justify-between gap-4 border-t-2 border-black pt-2 text-[12pt] font-medium">
            <dt>Total AED</dt>
            <dd className="m-0 tabular-nums">{money(order.totalAed)}</dd>
          </div>
        </dl>
      </div>

      {kind === "packing" && (
        <div className="mt-8 grid grid-cols-3 gap-8 text-[9.5pt]">
          {["Picked by", "Checked by", "Packed on"].map((label) => (
            <div key={label}>
              <div className="border-b border-black pb-6" />
              <div className="mt-1.5 uppercase tracking-[0.16em] text-neutral-600">{label}</div>
            </div>
          ))}
        </div>
      )}

      <footer className="mt-8 border-t border-neutral-300 pt-3 text-[8.5pt] leading-[1.6] text-neutral-600">
        All amounts are in UAE Dirhams (AED). VAT is charged at 5% on goods and
        delivery in accordance with UAE Federal Decree-Law No. 8 of 2017. This
        is a computer-generated document and does not require a signature.
        {kind === "receipt" && (
          <>
            {" "}
            Track your delivery any time at {siteHost}/track-order with your order
            number.
          </>
        )}
      </footer>
    </section>
  );
}

function money(aed: number): string {
  return aed.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function invoiceDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dubai",
  });
}

function paymentMethodLabel(method: string): string {
  switch (method) {
    case "COD":
      return "Cash on delivery";
    case "BANK_TRANSFER":
      return "Bank transfer";
    case "CARD":
      return "Card / Apple Pay";
    default:
      return titleCase(method);
  }
}

function titleCase(value: string): string {
  const lower = value.toLowerCase().replace(/_/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
