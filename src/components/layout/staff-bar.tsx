"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { readStaffHint } from "@/lib/staff-hint";

/**
 * The cookie, as an external store.
 *
 * The same shape as `hydratedStore` in `persisted-store.ts`: nothing to
 * subscribe to, because the cookie only changes across a sign-in or a sign-out,
 * and both of those are a navigation. What it buys is the two snapshots — the
 * server renders `false`, the browser answers from `document.cookie` — without
 * a `setState` in an effect.
 */
const staffHintStore = {
  subscribe: () => () => {},
  getSnapshot: readStaffHint,
  getServerSnapshot: () => false,
};

/**
 * The way back to the back office.
 *
 * The admin sidebar has carried a "View the shop ↗" link since it was built;
 * this is the other half of that door. Staff spend most of their day in the
 * storefront checking how a piece reads on a card, and the only route back was
 * typing `/admin` into the bar.
 *
 * It is a strip above the announcement bar rather than an icon in the header
 * row, because it should be unmistakable and because it must not compete with
 * the shop's own chrome — a customer never sees it at all.
 *
 * Drawn only after mount, since the answer lives in a cookie the page reads
 * for itself (see `staff-hint.ts` and §4.10 — the header cannot ask the server
 * who is signed in without making every page dynamic). That costs one small
 * downward shift on the staff member's own screen, and nothing on anyone
 * else's.
 */
export function StaffBar() {
  const staff = useSyncExternalStore(
    staffHintStore.subscribe,
    staffHintStore.getSnapshot,
    staffHintStore.getServerSnapshot,
  );

  if (!staff) return null;

  return (
    <div className="bg-ink border-b border-ink-line">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-[clamp(16px,2.2vw,34px)] py-2">
        <span className="text-[11px] tracking-[0.24em] uppercase text-taupe">
          FEEZEE Admin · you are signed in as staff
        </span>

        <Link
          href="/admin"
          className="text-[11.5px] tracking-[0.18em] uppercase text-gold hover:text-champagne"
        >
          Go to dashboard ↗
        </Link>
      </div>
    </div>
  );
}
