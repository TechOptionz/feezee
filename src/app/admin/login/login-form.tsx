"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { adminLoginAction, type AdminFormState } from "@/app/actions/admin";

const IDLE: AdminFormState = { status: "idle" };

/**
 * The admin sign-in.
 *
 * Its own inputs rather than the shop's form kit: those are drawn for ink on
 * cream and would be near-invisible here. Same behaviour, inverted palette.
 */
export function AdminLoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(adminLoginAction, IDLE);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="m-0 border border-wine/50 bg-wine/10 px-4 py-3 text-[13.5px] leading-[1.6] text-wine-bright"
        >
          {state.message}
        </p>
      )}

      <Field label="Email" name="email" type="email" autoComplete="username" />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
      />

      <Submit />
    </form>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11.5px] tracking-[0.18em] uppercase text-taupe">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="border border-ink-border bg-transparent px-3.5 py-3 text-[15px] text-champagne outline-none placeholder:text-taupe focus:border-gold"
      />
    </label>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 cursor-pointer border-none bg-gold px-7 py-3.5 text-[12.5px] tracking-[0.18em] uppercase text-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}
