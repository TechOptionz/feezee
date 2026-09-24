"use client";

import { cn } from "@/lib/utils";

function PrinterIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5.5 7V3h9v4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="2.5" y="7" width="15" height="7.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 12h9v5h-9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="14.5" cy="9.75" r="0.9" fill="currentColor" />
    </svg>
  );
}

/**
 * One click to the browser's print dialog.
 *
 * The page it sits on carries a `PrintInvoice` that is hidden on screen and
 * the only thing shown on paper, so "print" here means "print the invoice",
 * not "print this web page". The button hides itself when printing — a
 * printer icon on a tax invoice would be the one thing a customer notices.
 */
export function PrintButton({ label, className }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn(
        "print:hidden inline-flex cursor-pointer items-center justify-center gap-2.5 text-[12.5px] tracking-[0.16em] uppercase",
        className,
      )}
    >
      <PrinterIcon />
      {label}
    </button>
  );
}
