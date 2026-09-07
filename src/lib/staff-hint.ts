/**
 * Whether the person browsing the shop can also open the back office.
 *
 * The same problem as `account-scope.ts`, and the same answer. The session
 * cookie is httpOnly so the page cannot read it, and §4.10 forbids reading it
 * on the server from the header — that one cookie read would make every page
 * that draws the header dynamic and cost the shop its static rendering.
 *
 * So signing in as ADMIN or STAFF sets a third cookie, deliberately not
 * httpOnly, carrying nothing but the fact that a dashboard link is worth
 * drawing. **Nothing trusts it.** `/admin` is guarded by `requireStaff`, which
 * re-reads the user from the database (§4.8); forging this cookie earns you a
 * link that sends you to the admin sign-in page.
 *
 * Imported from both sides, so it stays free of `server-only`.
 */
export const STAFF_HINT_COOKIE = "feezee_staff";

/** The value is not meaningful — only its presence is. */
export const STAFF_HINT_VALUE = "1";

/**
 * True when this browser was last signed in as staff.
 *
 * Read on demand rather than cached, for the same reason as the account scope:
 * it changes under us on sign-in and sign-out, and the header wants the answer
 * that is true when it asks.
 */
export function readStaffHint(): boolean {
  if (typeof document === "undefined") return false;

  for (const part of document.cookie.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== STAFF_HINT_COOKIE) continue;
    return part.slice(eq + 1).trim() === STAFF_HINT_VALUE;
  }
  return false;
}
