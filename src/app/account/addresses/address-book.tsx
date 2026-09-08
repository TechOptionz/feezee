"use client";

import { useActionState, useState } from "react";
import {
  deleteAddressAction,
  saveAddressAction,
  setDefaultAddressAction,
} from "@/app/actions/account";
import {
  FormMessage,
  IDLE_FORM,
  SelectField,
  SubmitButton,
  TextField,
} from "@/components/forms/form-kit";
import { EMIRATES, formatUaePhone } from "@/modules/checkout";
import type { AddressView } from "@/modules/customers";
import { cn } from "@/lib/utils";

/**
 * The address book: the saved cards, and one form that both adds and edits.
 *
 * One form rather than two, because "edit" and "add" differ only by a hidden
 * id — and two nearly identical forms is how the emirate list ends up correct
 * in one of them and stale in the other.
 */
export function AddressBook({ addresses }: { addresses: AddressView[] }) {
  const [state, action] = useActionState(saveAddressAction, IDLE_FORM);
  const [editing, setEditing] = useState<AddressView | null>(null);
  const [open, setOpen] = useState(addresses.length === 0);

  const startEdit = (address: AddressView) => {
    setEditing(address);
    setOpen(true);
  };

  const startNew = () => {
    setEditing(null);
    setOpen(true);
  };

  return (
    <div className="flex flex-col gap-[clamp(26px,3.4vw,40px)]">
      {addresses.length > 0 && (
        <ul className="m-0 p-0 list-none grid grid-cols-1 nav:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <li
              key={address.id}
              className={cn(
                "border p-[clamp(18px,2.4vw,24px)] flex flex-col gap-3",
                address.isDefault ? "border-ink bg-panel" : "border-line",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[13px] tracking-[0.16em] uppercase text-ink">
                  {address.fullName}
                </span>
                {address.isDefault && (
                  <span className="text-[11px] tracking-[0.16em] uppercase text-gold-dark">
                    Default
                  </span>
                )}
              </div>

              <address className="not-italic text-[14px] leading-[1.75] text-cocoa">
                {address.addressLine1}
                {address.addressLine2 && (
                  <>
                    <br />
                    {address.addressLine2}
                  </>
                )}
                <br />
                {address.city}, {address.emirate}
                {address.landmark && (
                  <>
                    <br />
                    <span className="text-muted">Near {address.landmark}</span>
                  </>
                )}
                <br />
                {formatUaePhone(address.phone)}
              </address>

              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => startEdit(address)}
                  className="bg-transparent border-none cursor-pointer p-0 text-[12px] tracking-[0.14em] uppercase text-gold-dark hover:text-ink"
                >
                  Edit
                </button>

                {!address.isDefault && (
                  <>
                    <form action={setDefaultAddressAction}>
                      <input type="hidden" name="addressId" value={address.id} />
                      <button
                        type="submit"
                        className="bg-transparent border-none cursor-pointer p-0 text-[12px] tracking-[0.14em] uppercase text-gold-dark hover:text-ink"
                      >
                        Make default
                      </button>
                    </form>

                    <form action={deleteAddressAction}>
                      <input type="hidden" name="addressId" value={address.id} />
                      <button
                        type="submit"
                        className="bg-transparent border-none cursor-pointer p-0 text-[12px] tracking-[0.14em] uppercase text-muted hover:text-wine"
                      >
                        Remove
                      </button>
                    </form>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!open ? (
        <button
          type="button"
          onClick={startNew}
          className="self-start bg-ink text-cream border-none cursor-pointer px-7 py-3.5 text-[12.5px] tracking-[0.18em] uppercase"
        >
          Add an address
        </button>
      ) : (
        <section className="border border-line p-[clamp(20px,3vw,32px)]">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-3 mb-5">
            <h2 className="m-0 text-[13px] tracking-[0.22em] uppercase font-normal">
              {editing ? "Edit address" : "New address"}
            </h2>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setEditing(null);
                }}
                className="bg-transparent border-none cursor-pointer p-0 text-[12px] tracking-[0.14em] uppercase text-muted hover:text-ink"
              >
                Cancel
              </button>
            )}
          </div>

          {/*
            Keyed on which address is being edited, so switching from one card
            to another rebuilds the inputs with the new defaults instead of
            leaving the previous address's values in place.
          */}
          <form
            key={editing?.id ?? "new"}
            action={action}
            className="flex flex-col gap-4"
          >
            <input type="hidden" name="addressId" value={editing?.id ?? ""} />
            <FormMessage state={state} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <TextField
                label="Full name"
                name="fullName"
                required
                autoComplete="name"
                defaultValue={editing?.fullName ?? ""}
                error={state.fieldErrors?.fullName}
              />
              <TextField
                label="Mobile"
                name="phone"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="+971 50 123 4567"
                defaultValue={editing ? `+${editing.phone}` : ""}
                error={state.fieldErrors?.phone}
              />
              <SelectField
                label="Emirate"
                name="emirate"
                options={EMIRATES}
                defaultValue={editing?.emirate ?? "Dubai"}
                error={state.fieldErrors?.emirate}
              />
              <TextField
                label="Area or city"
                name="city"
                required
                autoComplete="address-level2"
                defaultValue={editing?.city ?? ""}
                error={state.fieldErrors?.city}
              />
              <TextField
                label="Street, building or villa"
                name="addressLine1"
                required
                autoComplete="address-line1"
                className="sm:col-span-2"
                defaultValue={editing?.addressLine1 ?? ""}
                error={state.fieldErrors?.addressLine1}
              />
              <TextField
                label="Apartment or floor (optional)"
                name="addressLine2"
                autoComplete="address-line2"
                defaultValue={editing?.addressLine2 ?? ""}
                error={state.fieldErrors?.addressLine2}
              />
              <TextField
                label="Landmark (optional)"
                name="landmark"
                placeholder="Near Madina Mall"
                defaultValue={editing?.landmark ?? ""}
                error={state.fieldErrors?.landmark}
              />
            </div>

            <label className="flex items-center gap-2.5 text-[14px] text-cocoa cursor-pointer">
              <input
                type="checkbox"
                name="isDefault"
                defaultChecked={editing?.isDefault ?? addresses.length === 0}
                className="w-[15px] h-[15px] accent-[var(--fz-ink)] cursor-pointer"
              />
              Deliver here by default
            </label>

            <SubmitButton pendingLabel="Saving…" className="self-start">
              {editing ? "Save changes" : "Save address"}
            </SubmitButton>
          </form>
        </section>
      )}
    </div>
  );
}
