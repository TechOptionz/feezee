"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changeStaffPasswordAction, type AdminFormState } from "@/app/actions/admin";

const IDLE: AdminFormState = { status: "idle" };

/** Drawn for the back office's ink palette, like the admin sign-in form. */
export function PasswordForm() {
  const [state, action] = useActionState(changeStaffPasswordAction, IDLE);

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="m-0 border border-wine/50 bg-wine/10 px-4 py-3 text-[14px] leading-[1.6] text-wine-bright"
        >
          {state.message}
        </p>
      )}
      {state.status === "ok" && state.message && (
        <p
          role="status"
          className="m-0 border border-gold/50 bg-gold/10 px-4 py-3 text-[14px] leading-[1.6] text-champagne"
        >
          {state.message}
        </p>
      )}

      <Field
        label="Current password"
        name="currentPassword"
        autoComplete="current-password"
        error={state.fieldErrors?.currentPassword}
      />
      <Field
        label="New password"
        name="newPassword"
        autoComplete="new-password"
        hint="At least 12 characters."
        error={state.fieldErrors?.newPassword}
      />
      <Field
        label="Confirm new password"
        name="confirm"
        autoComplete="new-password"
        error={state.fieldErrors?.confirm}
      />

      <Submit />
    </form>
  );
}

function Field({
  label,
  name,
  autoComplete,
  hint,
  error,
}: {
  label: string;
  name: string;
  autoComplete: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11.5px] font-medium tracking-[0.12em] uppercase text-taupe">
        {label}
      </span>
      <input
        name={name}
        type="password"
        autoComplete={autoComplete}
        required
        aria-invalid={error ? true : undefined}
        className="border border-ink-border bg-transparent px-3.5 py-3 text-[15px] text-champagne outline-none placeholder:text-taupe focus:border-gold"
      />
      {hint && !error && <span className="text-[13px] text-taupe">{hint}</span>}
      {error && <span className="text-[13px] text-wine-bright">{error}</span>}
    </label>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 cursor-pointer self-start border-none bg-gold px-7 py-3.5 text-[12.5px] font-semibold tracking-[0.12em] uppercase text-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Change password"}
    </button>
  );
}
