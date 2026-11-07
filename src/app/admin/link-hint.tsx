"use client";

import { useLinkStatus } from "next/link";

/**
 * A dot that appears inside a link while the navigation it started is still
 * in flight — for the filter tabs and page numbers, where the destination is
 * the same page with a different query string and nothing else would move
 * until the server answered.
 *
 * It waits 150 ms before it shows, so a navigation that returns quickly never
 * flashes it. Rendered inside the `<Link>`, which is where `useLinkStatus`
 * reads from.
 */
export function LinkHint() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-gold align-middle animate-[fz-hint_900ms_ease-in-out_150ms_infinite_both]"
    />
  );
}
