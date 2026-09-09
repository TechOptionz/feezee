"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveProductAction, type AdminFormState } from "@/app/actions/admin";
import { ImageUploader } from "@/app/admin/products/image-uploader";
import { SaleControls, SalePill } from "@/app/admin/products/sale-controls";
import { cn } from "@/lib/utils";

const IDLE: AdminFormState = { status: "idle" };

const COLLECTIONS = ["Printed Lawn", "Luxury Pret", "Ready to Wear", "Sale"];
const TYPES = ["Kurtas", "Suits", "Co-ords"];
const FABRIC_FAMILIES = [
  "Lawn",
  "Cambric",
  "Cotton",
  "Silk",
  "Grip",
  "Chiffon",
  "Tissue",
  "Viscose",
];

export type ProductFormValues = {
  id: number | null;
  name: string;
  fabric: string;
  fabricFamily: string;
  type: string;
  pieces: number;
  withDupatta: boolean;
  collection: string;
  aed: number;
  wasAed: number | null;
  badgeLabel: string;
  badgeTone: string;
  cut: string;
  colour: string;
  description: string;
  careInstructions: string;
  isArchived: boolean;
  images: string[];
  variants: { id: string; size: string; sku: string; stock: number }[];
};

/**
 * The product editor.
 *
 * One thing it deliberately cannot do: change stock. The variant table below is
 * read-only, and the numbers in it are links to the inventory screen. Stock is
 * a ledger — every movement has a reason and a balance — and letting it be
 * overwritten by a text field on a form that also edits the description is how
 * a count stops meaning anything.
 */
export function ProductForm({ values }: { values: ProductFormValues }) {
  const [state, action] = useActionState(saveProductAction, IDLE);
  const isNew = values.id === null;
  const onSale = values.wasAed !== null && values.wasAed > values.aed;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="productId" value={values.id ?? ""} />

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="m-0 border border-wine/50 bg-wine/10 px-4 py-3 text-[13.5px] text-wine-bright"
        >
          {state.message}
        </p>
      )}

      <Section title="The piece">
        <div className="grid grid-cols-1 nav:grid-cols-2 gap-4">
          <Field
            label="Name"
            name="name"
            defaultValue={values.name}
            required
            error={state.fieldErrors?.name}
            className="nav:col-span-2"
          />
          <Field
            label="Caption on the card"
            name="fabric"
            defaultValue={values.fabric}
            placeholder="Embroidered lawn, 3 pc"
          />
          <Select
            label="Fabric family"
            name="fabricFamily"
            defaultValue={values.fabricFamily}
            options={FABRIC_FAMILIES}
          />
          <Select
            label="Line"
            name="collection"
            defaultValue={values.collection}
            options={COLLECTIONS}
          />
          <Select label="Type" name="type" defaultValue={values.type} options={TYPES} />
          <Field
            label="Pieces"
            name="pieces"
            type="number"
            min={1}
            max={3}
            defaultValue={String(values.pieces)}
          />
          <Field
            label="Colour"
            name="colour"
            defaultValue={values.colour}
            placeholder="Sage Green"
          />
          <Field
            label="Cut"
            name="cut"
            defaultValue={values.cut}
            placeholder="Straight shirt with a flared trouser"
            className="nav:col-span-2"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
          <Check label="Sold with its dupatta" name="withDupatta" defaultChecked={values.withDupatta} />
          <Check
            label="Archived (hidden from the shop)"
            name="isArchived"
            defaultChecked={values.isArchived}
          />
        </div>
      </Section>

      <Section title="Price">
        {/*
          The quick way and the long way, in that order.

          The three fields below are the long way: they are saved with the rest
          of the form, and they will happily let you set a "was" price that is
          under the price, or a wine badge on a piece that is not reduced. The
          control above is the short way — it writes both prices and the badge
          together, immediately, and records who did it. A reduction made here
          does not wait for Save, which is why it says so.
        */}
        {!isNew && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border border-ink-line bg-ink/60 px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
                {onSale ? "On sale" : "Full price"}
              </span>
              <SalePill aed={values.aed} wasAed={values.wasAed} />
              <span className="text-[12.5px] text-taupe">
                Applied straight away, without saving the form.
              </span>
            </div>
            <SaleControls
              productId={values.id as number}
              aed={values.aed}
              wasAed={values.wasAed}
              variant="form"
            />
          </div>
        )}

        <div className="grid grid-cols-1 nav:grid-cols-3 gap-4">
          <Field
            label="Price (AED)"
            name="aed"
            type="number"
            step="0.01"
            min={0}
            defaultValue={String(values.aed)}
            required
            error={state.fieldErrors?.aed}
          />
          <Field
            label="Was (AED, optional)"
            name="wasAed"
            type="number"
            step="0.01"
            min={0}
            defaultValue={values.wasAed ? String(values.wasAed) : ""}
            error={state.fieldErrors?.wasAed}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Badge" name="badgeLabel" defaultValue={values.badgeLabel} placeholder="New" />
            <Select
              label="Badge tone"
              name="badgeTone"
              defaultValue={values.badgeTone || "gold"}
              options={["gold", "wine"]}
            />
          </div>
        </div>
      </Section>

      <Section title="Words">
        <div className="flex flex-col gap-4">
          <Area
            label="Description"
            name="description"
            rows={5}
            defaultValue={values.description}
          />
          <Area
            label="Care"
            name="careInstructions"
            rows={2}
            defaultValue={values.careInstructions}
            placeholder="Dry clean only. Store folded, with the dupatta on top."
          />
        </div>
      </Section>

      <Section title="Photographs">
        <ImageUploader defaultImages={values.images} />
      </Section>

      {!isNew && (
        <Section title="Sizes">
          <p className="m-0 mb-4 text-[13px] leading-[1.7] text-taupe">
            Stock is changed on the inventory screen, where every movement is
            written to the ledger with a reason.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Size", "SKU", "Stock"].map((head) => (
                    <th
                      key={head}
                      scope="col"
                      className="whitespace-nowrap border-b border-ink-line py-2.5 pr-5 text-left text-[11px] tracking-[0.16em] uppercase font-normal text-taupe"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {values.variants.map((variant) => (
                  <tr key={variant.id}>
                    <td className="border-b border-ink-line/60 py-2.5 pr-5 text-[13.5px] text-champagne">
                      {variant.size}
                    </td>
                    <td className="border-b border-ink-line/60 py-2.5 pr-5 text-[13px] text-taupe">
                      {variant.sku}
                    </td>
                    <td className="border-b border-ink-line/60 py-2.5 pr-5 text-[13.5px] tabular-nums">
                      <Link
                        href={`/admin/inventory?q=${encodeURIComponent(values.name)}`}
                        className={cn(
                          "hover:text-champagne",
                          variant.stock === 0 ? "text-wine-bright" : "text-gold-light",
                        )}
                      >
                        {variant.stock}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {isNew && (
        <p className="m-0 border border-ink-line bg-ink/40 px-5 py-4 text-[13.5px] leading-[1.7] text-taupe">
          Six sizes (XS–XXL) are created at zero stock. Put the pieces on the
          rail from the inventory screen once they are counted in.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Save isNew={isNew} />
        <Link
          href="/admin/products"
          className="text-[12px] tracking-[0.16em] uppercase text-taupe hover:text-champagne"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Save({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="cursor-pointer border-none bg-gold px-7 py-3.5 text-[12.5px] tracking-[0.18em] uppercase text-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : isNew ? "Create product" : "Save changes"}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-ink-line bg-ink/40 p-[clamp(16px,2.2vw,24px)]">
      <h2 className="m-0 mb-4 border-b border-ink-line pb-3 text-[12.5px] tracking-[0.22em] uppercase font-normal text-champagne">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
        {label}
      </span>
      <input
        aria-invalid={Boolean(error)}
        className={cn(
          "border bg-transparent px-3 py-2.5 text-[14.5px] text-champagne outline-none placeholder:text-taupe",
          error ? "border-wine focus:border-wine" : "border-ink-line focus:border-gold",
        )}
        {...rest}
      />
      {error && (
        <span role="alert" className="text-[12px] text-wine-bright">
          {error}
        </span>
      )}
    </label>
  );
}

function Select({
  label,
  options,
  className,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
        {label}
      </span>
      <select
        className="border border-ink-line bg-ink px-3 py-2.5 text-[14.5px] text-champagne outline-none focus:border-gold"
        {...rest}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Area({
  label,
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
        {label}
      </span>
      <textarea
        className="border border-ink-line bg-transparent px-3 py-2.5 text-[14.5px] leading-[1.7] text-champagne outline-none resize-y placeholder:text-taupe focus:border-gold"
        {...rest}
      />
    </label>
  );
}

function Check({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2.5 text-[13.5px] text-sandstone cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="w-[15px] h-[15px] accent-[var(--fz-gold)] cursor-pointer"
      />
      {label}
    </label>
  );
}
