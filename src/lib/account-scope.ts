/**
 * Whose bag and whose wishlist this browser is holding.
 *
 * The session cookie is httpOnly and must stay that way, so the page cannot ask
 * it who is signed in. Reading it on the server is not open to us either: §4.10
 * of PROJECT_MEMORY — a cookie read in the header would make every page that
 * renders the header dynamic and cost the shop its static rendering.
 *
 * So sign-in sets a second cookie holding an opaque scope id, readable by the
 * page precisely so that the browser store can tell one account's saved pieces
 * from another's. It is a namespace, not a credential: it cannot be reversed to
 * a user id, and every server action re-reads the real session regardless.
 * Forging it renames a `localStorage` key in your own browser and nothing else.
 *
 * This file is imported from both sides, so it stays free of `server-only` and
 * of anything that needs a DOM at module load.
 */
export const ACCOUNT_SCOPE_COOKIE = "feezee_scope";

/**
 * The scope in this browser right now, or null for a guest.
 *
 * Read on demand rather than cached: it changes under us on sign-in and
 * sign-out, and the store needs the answer that is true at the moment it asks.
 */
export function readAccountScope(): string | null {
  if (typeof document === "undefined") return null;

  for (const part of document.cookie.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== ACCOUNT_SCOPE_COOKIE) continue;
    return decodeURIComponent(part.slice(eq + 1).trim()) || null;
  }
  return null;
}

/**
 * The `localStorage` key a store should use for the given scope.
 *
 * A guest keeps the unsuffixed key so that a bag filled before signing in is
 * still there afterwards — the merge on sign-in is what moves it across, and it
 * needs somewhere to move it from.
 */
export function scopedKey(base: string, scope: string | null): string {
  return scope ? `${base}:${scope}` : base;
}
