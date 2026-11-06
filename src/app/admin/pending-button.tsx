"use client";

import { useFormStatus } from "react-dom";

/**
 * A submit button that says so while its form is in flight.
 *
 * For the plain `<form action={serverAction}>` buttons in server components —
 * Archive, Sign out — which otherwise give nothing back for the second or so
 * the action takes against a far-away database. Disabled while pending, so a
 * second click cannot queue the same action twice.
 */
export function PendingButton({
  children,
  pendingLabel = "Working…",
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}
