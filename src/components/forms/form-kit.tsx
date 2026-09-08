"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * The parts every form on this site is built from.
 *
 * One place, because a shop with a checkout, an account area and an admin has
 * about thirty text inputs, and the alternative is thirty slightly different
 * ones. The styling is the design's: a hairline that turns gold on focus, wine
 * when the field is wrong, and a label in small caps above rather than a
 * placeholder pretending to be one.
 */

export type FormState = {
  status: "idle" | "error" | "ok";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const IDLE_FORM: FormState = { status: "idle" };

export function FieldError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <span role="alert" className="text-[12.5px] leading-[1.5] text-wine">
      {children}
    </span>
  );
}

export function TextField({
  label,
  name,
  error,
  hint,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="text-[12px] tracking-[0.18em] uppercase text-muted">
        {label}
      </span>
      <input
        name={name}
        aria-invalid={Boolean(error)}
        className={cn(
          "border bg-transparent px-3.5 py-3 text-[15px] text-ink outline-none placeholder:text-muted",
          error ? "border-wine focus:border-wine" : "border-line focus:border-gold",
        )}
        {...rest}
      />
      {hint && !error && (
        <span className="text-[12.5px] text-muted">{hint}</span>
      )}
      <FieldError>{error}</FieldError>
    </label>
  );
}

export function SelectField({
  label,
  name,
  error,
  options,
  className,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  error?: string;
  options: readonly string[];
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="text-[12px] tracking-[0.18em] uppercase text-muted">
        {label}
      </span>
      <select
        name={name}
        aria-invalid={Boolean(error)}
        className={cn(
          "border bg-transparent px-3.5 py-3 text-[15px] text-ink outline-none",
          error ? "border-wine focus:border-wine" : "border-line focus:border-gold",
        )}
        {...rest}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <FieldError>{error}</FieldError>
    </label>
  );
}

export function TextArea({
  label,
  name,
  error,
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
  error?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="text-[12px] tracking-[0.18em] uppercase text-muted">
        {label}
      </span>
      <textarea
        name={name}
        rows={3}
        aria-invalid={Boolean(error)}
        className={cn(
          "border bg-transparent px-3.5 py-3 text-[15px] text-ink outline-none resize-y placeholder:text-muted",
          error ? "border-wine focus:border-wine" : "border-line focus:border-gold",
        )}
        {...rest}
      />
      <FieldError>{error}</FieldError>
    </label>
  );
}

/**
 * A submit button that knows whether its own form is in flight.
 *
 * `useFormStatus` has to be read from a child of the `<form>`, which is exactly
 * why this is its own component rather than a prop on the page.
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "solid",
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "solid" | "outline";
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "px-7 py-3.5 text-[12.5px] tracking-[0.18em] uppercase cursor-pointer transition-colors duration-200",
        "disabled:cursor-not-allowed disabled:opacity-55",
        variant === "solid"
          ? "bg-ink text-cream border-none hover:bg-cocoa"
          : "bg-transparent text-ink border border-line hover:border-ink",
        className,
      )}
    >
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}

/** The banner a form shows when the server answers with something to say. */
export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "idle" || !state.message) return null;

  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={cn(
        "m-0 border px-5 py-3.5 text-[14px] leading-[1.6]",
        state.status === "error"
          ? "border-wine bg-wine/5 text-wine"
          : "border-gold/40 bg-panel text-cocoa",
      )}
    >
      {state.message}
    </p>
  );
}
