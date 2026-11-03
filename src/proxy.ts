import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_PREFIX,
  isAdminRoute,
  stripAdminPrefix,
  surfaceOf,
} from "@/lib/admin-host";

/**
 * One deploy, two hosts: the shop, and the back office on its own subdomain.
 *
 * On the admin host every page URL is mapped onto the `/admin` routes, so
 * `/orders` serves `/admin/orders`; typing the prefix anyway is redirected to
 * the clean URL. On the shop's host `/admin` does not exist — it answers
 * exactly like any other unknown address, with no redirect and no hint.
 *
 * Deploy previews (`*.netlify.app`) have no admin host and are left alone.
 *
 * This is the front door, not the lock: every admin page, action and route
 * still checks the session itself (`requireStaff`, `requireStaffAction`).
 */

/** Served as they are on the admin host rather than mapped under `/admin`. */
const PASSTHROUGH = ["/api", "/_next", "/media", "/img"];

/** A path no route matches, so the app's own not-found page answers it. */
const NOT_FOUND = "/_not-found";

export function proxy(request: NextRequest) {
  const surface = surfaceOf(request.headers.get("host"));
  if (surface === "preview") return NextResponse.next();
  return surface === "admin" ? adminHost(request) : shopHost(request);
}

function adminHost(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  let response: NextResponse;

  if (isAdminRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = stripAdminPrefix(pathname);
    response = NextResponse.redirect(url, 308);
  } else if (passesThrough(pathname)) {
    response = NextResponse.next();
  } else {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? ADMIN_PREFIX : `${ADMIN_PREFIX}${pathname}`;
    response = NextResponse.rewrite(url);
  }

  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

function shopHost(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (isAdminRoute(pathname)) return notFound(request);

  // The back office's API only answers calls made from the back office.
  if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) {
    if (surfaceOf(callerHost(request)) !== "admin") return notFound(request);
  }

  return NextResponse.next();
}

function passesThrough(pathname: string): boolean {
  return (
    PASSTHROUGH.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt"
  );
}

/** The host of the page that made the request, from `Origin` or `Referer`. */
function callerHost(request: NextRequest): string | null {
  for (const header of ["origin", "referer"]) {
    const value = request.headers.get(header);
    if (!value) continue;
    try {
      return new URL(value).host;
    } catch {
      // A malformed header is no caller at all.
    }
  }
  return null;
}

function notFound(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = NOT_FOUND;
  url.search = "";
  return NextResponse.rewrite(url);
}

export const config = {
  // Everything except build output and images, which never differ by host.
  matcher: ["/((?!_next/static|_next/image|img/|media/|favicon.ico).*)"],
};
