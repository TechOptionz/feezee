"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  resetPasswordAction,
} from "@/app/actions/account";
import {
  FormMessage,
  IDLE_FORM,
  SubmitButton,
  TextField,
} from "@/components/forms/form-kit";

/**
 * The four screens that get someone in: sign in, register, ask for a reset,
 * choose a new password.
 *
 * All four are the same shape — a card, a field or two, one button — so they
 * are one file. Each is a `useActionState` form, which means it still works
 * with JavaScript off: the browser posts the form, the server action runs, and
 * the reply comes back as a normal page.
 */

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, IDLE_FORM);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />

      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />

      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>

      <div className="flex flex-wrap justify-between gap-3 pt-1 text-[13px]">
        <Link
          href="/account/forgot-password"
          className="text-gold-dark hover:text-ink"
        >
          Forgotten your password?
        </Link>
        <Link href="/account/register" className="text-gold-dark hover:text-ink">
          Create an account
        </Link>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, IDLE_FORM);

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage state={state} />

      <TextField
        label="Name"
        name="name"
        autoComplete="name"
        required
        error={state.fieldErrors?.name}
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />
      <TextField
        label="Mobile (optional)"
        name="phone"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+971 50 123 4567"
        error={state.fieldErrors?.phone}
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="At least 8 characters."
        error={state.fieldErrors?.password}
      />

      <SubmitButton pendingLabel="Creating your account…">
        Create account
      </SubmitButton>

      <p className="m-0 pt-1 text-[13px] text-cocoa">
        Already have one?{" "}
        <Link href="/account/login" className="text-gold-dark hover:text-ink">
          Sign in
        </Link>
        .
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, IDLE_FORM);

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage state={state} />

      {state.status !== "ok" && (
        <>
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={state.fieldErrors?.email}
          />
          <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
        </>
      )}

      <p className="m-0 pt-1 text-[13px] text-cocoa">
        <Link href="/account/login" className="text-gold-dark hover:text-ink">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, IDLE_FORM);

  if (!token) {
    return (
      <p className="m-0 text-[14.5px] leading-[1.7] text-cocoa">
        That link is missing its token.{" "}
        <Link
          href="/account/forgot-password"
          className="text-gold-dark hover:text-ink"
        >
          Ask for a new one
        </Link>
        .
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />

      <TextField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="At least 8 characters."
        error={state.fieldErrors?.password}
      />
      <TextField
        label="Confirm new password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirm}
      />

      <SubmitButton pendingLabel="Saving…">Set new password</SubmitButton>
    </form>
  );
}
