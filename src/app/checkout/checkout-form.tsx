"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useStore } from "@/components/store/store-provider";
import { priceBag } from "@/app/actions/cart";
import { submitCheckout } from "@/app/actions/checkout";
import { EMIRATES } from "@/modules/checkout";
import type { PricedBasket } from "@/modules/orders";
import type { PaymentOption } from "@/modules/payments";
import type { AddressView } from "@/modules/customers";
import { img } from "@/lib/assets";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

/**
 * Checkout: one page, three questions — where it goes, how you pay, and is this
 * right.
 *
 * Deliberately not a wizard. A bag of two or three garments does not need to be
 * broken across four screens, and every step in a checkout is somewhere else to
 * abandon it. The order summary sits beside the form on a desktop and above it
 * on a phone, so the total is on screen while the address is typed.
 */
export function CheckoutForm({
  paymentOptions,
  addresses,
  signedIn,
  defaults,
}: {
  paymentOptions: PaymentOption[];
  addresses: AddressView[];
  signedIn: boolean;
  defaults: { fullName: string; email: string; phone: string } | null;
}) {
  const router = useRouter();
  const { cart, currency, hydrated, clearBag } = useStore();
  const [priced, setPriced] = useState<PricedBasket | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const preset = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  const [form, setForm] = useState({
    fullName: defaults?.fullName ?? preset?.fullName ?? "",
    email: defaults?.email ?? "",
    phone: preset?.phone ? `+${preset.phone}` : (defaults?.phone ? `+${defaults.phone}` : ""),
    emirate: preset?.emirate ?? "Dubai",
    city: preset?.city ?? "",
    addressLine1: preset?.addressLine1 ?? "",
    addressLine2: preset?.addressLine2 ?? "",
    landmark: preset?.landmark ?? "",
    notes: "",
    paymentMethod: paymentOptions[0]?.method ?? "COD",
    saveAddress: false,
  });

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* The bag is priced on the server, and re-priced whenever it changes. */
  useEffect(() => {
    if (!hydrated || cart.length === 0) return;
    let cancelled = false;
    priceBag(cart.map((l) => ({ variantId: l.variantId, quantity: l.qty })))
      .then((result) => !cancelled && setPriced(result))
      .catch(() => !cancelled && setError("We could not price your bag. Please reload."));
    return () => {
      cancelled = true;
    };
  }, [cart, hydrated]);

  const applyAddress = (address: AddressView) => {
    setForm((f) => ({
      ...f,
      fullName: address.fullName,
      phone: `+${address.phone}`,
      emirate: address.emirate,
      city: address.city,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? "",
      landmark: address.landmark ?? "",
    }));
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await submitCheckout(
        cart.map((l) => ({ variantId: l.variantId, quantity: l.qty })),
        form,
      );

      if (result.status === "error") {
        setError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        // A bag that changed under the customer needs re-pricing before they
        // try again, or they will read the same stale total twice.
        priceBag(cart.map((l) => ({ variantId: l.variantId, quantity: l.qty })))
          .then(setPriced)
          .catch(() => {});
        return;
      }

      if (result.status === "placed") {
        // The bag is emptied only once the order exists. Clearing it before
        // would lose the basket if the order failed.
        clearBag();
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        }
        router.push(`/order-confirmation/${result.orderNumber}`);
      }
    });
  };

  if (!hydrated) return <div className="min-h-[50vh]" />;

  if (cart.length === 0) {
    return (
      <div className="py-[clamp(40px,7vw,90px)] text-center">
        <p className="m-0 font-display text-[clamp(22px,3vw,32px)]">
          There is nothing to check out.
        </p>
        <p className="mt-3 mb-7 text-[15px] text-cocoa">
          Your bag is empty — add a piece and come back.
        </p>
        <Link
          href="/new-in"
          className="bg-ink text-cream hover:text-cream px-7 py-3.5 text-[13px] tracking-[0.18em] uppercase"
        >
          Shop New In
        </Link>
      </div>
    );
  }

  const totals = priced?.totals;

  /*
   * The rows are the server's, not the bag's, as soon as the server has
   * answered. `priceBasket` trims a line to what is left on the rail and drops
   * anything archived, so drawing the saved bag beside those totals shows a
   * quantity the customer is not being charged for — four of a piece over a
   * subtotal for two. The snapshot is only good enough for the frame before
   * the first price comes back.
   */
  const summaryLines = priced
    ? priced.lines.map((line) => ({
        variantId: line.variantId,
        name: line.productName,
        size: line.size,
        qty: line.quantity,
        image: line.image,
        totalAed: line.totalAed,
      }))
    : cart.map((line) => ({
        variantId: line.variantId,
        name: line.name,
        size: line.size,
        qty: line.qty,
        image: line.image,
        totalAed: line.unitPriceAed * line.qty,
      }));

  const changed =
    priced && (priced.removed.length > 0 || priced.adjusted.length > 0);

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-start gap-x-[clamp(28px,4vw,64px)] gap-y-10 pb-[clamp(30px,4vw,56px)]"
    >
      <div className="flex-[1_1_440px] min-w-0 flex flex-col gap-[clamp(26px,3vw,38px)]">
        {error && (
          <p
            role="alert"
            className="m-0 border border-wine bg-wine/5 px-5 py-4 text-[14px] leading-[1.6] text-wine"
          >
            {error}
          </p>
        )}

        {!signedIn && (
          <p className="m-0 bg-panel px-5 py-4 text-[14px] leading-[1.7] text-cocoa">
            Checking out as a guest.{" "}
            <Link href="/account/login?next=/checkout" className="text-gold-dark border-b border-current">
              Sign in
            </Link>{" "}
            to use a saved address and keep your order history.
          </p>
        )}

        {addresses.length > 0 && (
          <Section title="Saved addresses">
            <div className="flex flex-wrap gap-3">
              {addresses.map((address) => (
                <button
                  key={address.id}
                  type="button"
                  onClick={() => applyAddress(address)}
                  className="flex-1 min-w-[220px] border border-line p-4 text-left cursor-pointer bg-transparent hover:border-ink"
                >
                  <div className="text-[13px] tracking-[0.14em] uppercase text-ink">
                    {address.fullName}
                    {address.isDefault && (
                      <span className="ml-2 text-[11px] text-gold-dark">Default</span>
                    )}
                  </div>
                  <div className="mt-1.5 text-[13.5px] leading-[1.6] text-cocoa">
                    {address.addressLine1}
                    <br />
                    {address.city}, {address.emirate}
                  </div>
                </button>
              ))}
            </div>
          </Section>
        )}

        <Section title="Delivery details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
            <Field
              label="Full name"
              value={form.fullName}
              onChange={(v) => set("fullName", v)}
              error={fieldErrors.fullName}
              autoComplete="name"
              required
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              error={fieldErrors.email}
              autoComplete="email"
              required
            />
            <Field
              label="Mobile"
              value={form.phone}
              onChange={(v) => set("phone", v)}
              error={fieldErrors.phone}
              placeholder="+971 50 123 4567"
              autoComplete="tel"
              inputMode="tel"
              required
            />
            <label className="flex flex-col gap-2">
              <span className="text-[12px] tracking-[0.18em] uppercase text-muted">
                Emirate
              </span>
              <select
                value={form.emirate}
                onChange={(e) => set("emirate", e.target.value)}
                className="border border-line bg-transparent px-3.5 py-3 text-[15px] text-ink outline-none focus:border-gold"
              >
                {EMIRATES.map((emirate) => (
                  <option key={emirate} value={emirate}>
                    {emirate}
                  </option>
                ))}
              </select>
              {fieldErrors.emirate && <Err>{fieldErrors.emirate}</Err>}
            </label>
            <Field
              label="Area or city"
              value={form.city}
              onChange={(v) => set("city", v)}
              error={fieldErrors.city}
              placeholder="Al Muhaisnah"
              autoComplete="address-level2"
              required
            />
            <Field
              label="Landmark (optional)"
              value={form.landmark}
              onChange={(v) => set("landmark", v)}
              error={fieldErrors.landmark}
              placeholder="Near Madina Mall"
            />
            <div className="sm:col-span-2">
              <Field
                label="Street, building or villa"
                value={form.addressLine1}
                onChange={(v) => set("addressLine1", v)}
                error={fieldErrors.addressLine1}
                autoComplete="address-line1"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Apartment or floor (optional)"
                value={form.addressLine2}
                onChange={(v) => set("addressLine2", v)}
                error={fieldErrors.addressLine2}
                autoComplete="address-line2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="flex flex-col gap-2">
                <span className="text-[12px] tracking-[0.18em] uppercase text-muted">
                  Anything the rider should know (optional)
                </span>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={3}
                  className="border border-line bg-transparent px-3.5 py-3 text-[15px] text-ink outline-none focus:border-gold resize-y"
                />
              </label>
            </div>
            {signedIn && (
              <label className="sm:col-span-2 flex items-center gap-2.5 text-[14px] text-cocoa cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.saveAddress}
                  onChange={(e) => set("saveAddress", e.target.checked)}
                  className="w-[15px] h-[15px] accent-[var(--fz-ink)] cursor-pointer"
                />
                Save this address to my account
              </label>
            )}
          </div>
        </Section>

        <Section title="Payment">
          <div className="flex flex-col gap-3">
            {paymentOptions.map((option) => (
              <label
                key={option.method}
                className={cn(
                  "flex items-start gap-3 border p-4 cursor-pointer transition-colors",
                  form.paymentMethod === option.method
                    ? "border-ink bg-panel"
                    : "border-line hover:border-ink",
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.method}
                  checked={form.paymentMethod === option.method}
                  onChange={() => set("paymentMethod", option.method)}
                  className="mt-1 accent-[var(--fz-ink)] cursor-pointer"
                />
                <span className="flex flex-col gap-1">
                  <span className="text-[13.5px] tracking-[0.12em] uppercase text-ink">
                    {option.label}
                  </span>
                  <span className="text-[13.5px] leading-[1.6] text-cocoa">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
            {fieldErrors.paymentMethod && <Err>{fieldErrors.paymentMethod}</Err>}
          </div>
        </Section>
      </div>

      {/* ---- Summary ------------------------------------------------------- */}
      <aside className="flex-[1_1_320px] bg-panel p-[clamp(22px,3vw,34px)] flex flex-col gap-4 nav:sticky nav:top-6">
        <h2 className="m-0 text-[13px] tracking-[0.22em] uppercase font-normal">
          Your order
        </h2>

        {/* Said here as well as on the cart page: a bag can go short between
            the two, and the summary is the last place to read it before the
            order is placed. */}
        {changed && (
          <div
            role="status"
            className="border border-wine/40 px-4 py-3 text-[13.5px] leading-[1.65] text-cocoa"
          >
            {priced.removed.map((label) => (
              <div key={label}>
                <strong className="text-wine">{label}</strong> has sold out and
                is no longer in your order.
              </div>
            ))}
            {priced.adjusted.map((item) => (
              <div key={item.label}>
                Only {item.available} of <strong>{item.label}</strong> left —
                the quantity has come down.
              </div>
            ))}
          </div>
        )}

        <ul className="m-0 p-0 list-none flex flex-col gap-3">
          {summaryLines.map((line) => (
            <li key={line.variantId} className="flex items-center gap-3">
              <div className="relative h-[64px] w-[50px] shrink-0 overflow-hidden bg-sand">
                {line.image && (
                  <Image
                    src={img(line.image)}
                    alt=""
                    fill
                    sizes="50px"
                    className="object-cover object-top"
                  />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[13.5px] text-ink">{line.name}</span>
                <span className="text-[12.5px] text-muted">
                  Size {line.size} · {line.qty}
                </span>
              </div>
              <span className="text-[13.5px] text-ink whitespace-nowrap">
                {formatPrice(line.totalAed, currency)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="m-0 flex flex-col gap-2.5 border-t border-line pt-4 text-[14.5px]">
          <Row label="Subtotal" value={totals ? formatPrice(totals.subtotalAed, currency) : "—"} />
          <Row
            label="Delivery"
            value={
              totals
                ? totals.shippingFeeAed === 0
                  ? "Free"
                  : formatPrice(totals.shippingFeeAed, currency)
                : "—"
            }
          />
          <Row label="VAT (5%)" value={totals ? formatPrice(totals.vatAed, currency) : "—"} />
          <div className="flex justify-between gap-4 border-t border-line pt-3">
            <dt className="text-[13px] tracking-[0.14em] uppercase self-center">Total</dt>
            <dd className="m-0 text-[17px] font-medium">
              {totals ? formatPrice(totals.totalAed, currency) : "—"}
            </dd>
          </div>
        </dl>

        {totals && !totals.freeShippingEarned && (
          <p className="m-0 text-[12.5px] leading-[1.5] text-muted">
            Add {formatPrice(totals.toFreeShippingAed, currency)} more for free UAE
            delivery.
          </p>
        )}

        <button
          type="submit"
          // Nothing left to buy once the server has dropped every line: the
          // totals would read zero and the order would fail on submit.
          disabled={pending || !totals || summaryLines.length === 0}
          className="bg-ink text-cream border-none cursor-pointer px-7 py-4 text-[13px] tracking-[0.18em] uppercase disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Placing your order…" : "Place order"}
        </button>

        <p className="m-0 text-[12.5px] leading-[1.6] text-muted">
          By placing this order you agree to our exchange policy. We confirm
          every order on WhatsApp before it is dispatched.
        </p>
      </aside>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="m-0 mb-4 text-[13px] tracking-[0.22em] uppercase font-normal border-b border-line pb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-cocoa">{label}</dt>
      <dd className="m-0">{value}</dd>
    </div>
  );
}

function Err({ children }: { children: React.ReactNode }) {
  return (
    <span role="alert" className="text-[12.5px] text-wine">
      {children}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  ...rest
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email";
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[12px] tracking-[0.18em] uppercase text-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={cn(
          "border bg-transparent px-3.5 py-3 text-[15px] text-ink outline-none placeholder:text-muted",
          error ? "border-wine focus:border-wine" : "border-line focus:border-gold",
        )}
        {...rest}
      />
      {error && <Err>{error}</Err>}
    </label>
  );
}
