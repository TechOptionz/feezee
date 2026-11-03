/**
 * Where the back office lives, and how to write a link into it.
 *
 * In production the admin has a host of its own — `admin.feezeefashion.ae` —
 * and the shop's `/admin` is a 404 (see `src/proxy.ts`). On that host the
 * `/admin` prefix is dropped from every URL: `/orders` is the orders page, and
 * the proxy rewrites it onto the `/admin/orders` route underneath.
 *
 * Deploy previews have no admin host, so on `*.netlify.app` nothing changes and
 * the back office stays at `/admin`.
 *
 * Every hostname the site knows about is in this file and nowhere else. It is
 * imported by the proxy, by server code and by the browser, so it stays free of
 * `server-only` and of anything Node-specific. `ADMIN_HOST` reaches the browser
 * through `env` in next.config.ts, which means it is fixed at build time.
 */

const DEFAULT_ADMIN_HOST = "admin.feezeefashion.ae";

/** `*.localhost` resolves to the loopback in every current browser. */
export const DEV_ADMIN_HOSTNAME = "admin.localhost";
const DEV_ADMIN_ORIGIN = `http://${DEV_ADMIN_HOSTNAME}:3000`;

const PREVIEW_SUFFIX = ".netlify.app";

/** The route segment the back office is built under. */
export const ADMIN_PREFIX = "/admin";

export const adminHost = (
  process.env.ADMIN_HOST?.trim() || DEFAULT_ADMIN_HOST
).toLowerCase();

const development = process.env.NODE_ENV === "development";

/**
 * Which face of the site a host shows.
 *
 * - `admin`: the back office, without the `/admin` prefix.
 * - `preview`: a Netlify deploy preview — shop and `/admin` side by side.
 * - `main`: the shop, with no back office at all.
 */
export type Surface = "admin" | "preview" | "main";

export function surfaceOf(host: string | null | undefined): Surface {
  const value = (host ?? "").trim().toLowerCase();
  const hostname = value.replace(/:\d+$/, "");

  if (value === adminHost || hostname === adminHost) return "admin";
  if (development && hostname === DEV_ADMIN_HOSTNAME) return "admin";
  if (hostname.endsWith(PREVIEW_SUFFIX)) return "preview";
  return "main";
}

/** True when `path` is `/admin` itself or anything under it. */
export function isAdminRoute(path: string): boolean {
  return path === ADMIN_PREFIX || path.startsWith(`${ADMIN_PREFIX}/`);
}

/** `/admin/orders` → `/orders`, `/admin` → `/`. Anything else is returned as is. */
export function stripAdminPrefix(path: string): string {
  if (!isAdminRoute(path)) return path;
  return path.slice(ADMIN_PREFIX.length) || "/";
}

/**
 * What every admin URL starts with on a given surface: nothing on the admin
 * host, `/admin` everywhere else.
 */
export type AdminBase = "" | typeof ADMIN_PREFIX;

export function adminBaseFor(surface: Surface): AdminBase {
  return surface === "admin" ? "" : ADMIN_PREFIX;
}

/**
 * An admin link, written without the prefix: `adminPath(base, "/orders")`.
 * `"/"` is the dashboard. A query string is carried through untouched.
 *
 * Code does not call this directly — it asks `getAdminPath()` on the server or
 * `useAdminPath()` in the browser, which already know the base.
 */
export function adminPath(base: AdminBase, path: string): string {
  if (path === "/" || path === "") return base || "/";
  if (path.startsWith("?")) return `${base || "/"}${path}`;
  return `${base}${path}`;
}

/**
 * Whether a `next` parameter may be followed after signing in: a path on this
 * host, inside the back office. Anything else would make the sign-in form an
 * open redirect.
 */
export function isSafeAdminReturn(base: AdminBase, next: string): boolean {
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return false;
  }
  return base === "" || isAdminRoute(next.split(/[?#]/, 1)[0]!);
}

/**
 * A link *into* the back office from the shop, which lives on another host:
 * absolute to the admin host in production and development, a plain `/admin`
 * path on a deploy preview where both live together.
 */
export function adminEntryUrl(currentHost: string | null | undefined, path = "/"): string {
  const surface = surfaceOf(currentHost);
  if (surface !== "main") return adminPath(adminBaseFor(surface), path);

  const origin = development ? DEV_ADMIN_ORIGIN : `https://${adminHost}`;
  return `${origin}${path === "/" ? "" : path}`;
}
