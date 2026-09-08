import "server-only";
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { Role } from "@/generated/prisma/enums";
import { ACCOUNT_SCOPE_COOKIE } from "@/lib/account-scope";
import { STAFF_HINT_COOKIE, STAFF_HINT_VALUE } from "@/lib/staff-hint";

/**
 * Sessions: a signed JWT in an httpOnly cookie.
 *
 * httpOnly so no script on the page can read it, `sameSite: lax` so it survives
 * a return from Stripe but is not sent on a cross-site POST, and `secure` off
 * the moment we are not on HTTPS — otherwise nobody could log in on localhost.
 *
 * The token carries the role, which makes an admin page check free. It also
 * means a role *change* does not take effect until the session is renewed, so
 * anything destructive re-reads the user from the database rather than trusting
 * the claim — see `requireAdmin` in the admin module.
 */

const COOKIE = "feezee_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * A second cookie, deliberately *not* httpOnly.
 *
 * The session itself must stay unreadable to scripts, but the browser store
 * still has to know one thing: whose bag and whose wishlist it is holding.
 * Without that, one browser has one wishlist shared by every account that signs
 * into it. Reading the session on the server to answer it is not open to us —
 * §4.10, a cookie read in the header costs the whole shop its static rendering.
 *
 * So this carries an opaque scope id instead: an HMAC of the user id under the
 * session secret, which is stable for a given user, reveals no user id, and is
 * useless as a credential. Nothing trusts it. Every wishlist action re-reads
 * the real session, exactly as `requireAdmin` re-reads the user (§4.8); forging
 * this cookie renames a `localStorage` key in your own browser and grants
 * nothing.
 *
 * The name itself lives in `@/lib/account-scope`, which the browser can import
 * and this server-only file cannot be imported from.
 */

/** Opaque, stable per user, and not reversible back to the id. */
function accountScope(userId: string): string {
  return createHmac("sha256", secret()).update(userId).digest("hex").slice(0, 32);
}

export type SessionClaims = {
  userId: string;
  email: string;
  name: string;
  role: Role;
};

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set and at least 32 characters. See .env.example.",
    );
  }
  return new TextEncoder().encode(value);
}

export async function createSession(claims: SessionClaims): Promise<void> {
  const token = await new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

  // Same lifetime as the session, so the two can never disagree about who is
  // signed in. Readable by the page on purpose — see the note above.
  jar.set(ACCOUNT_SCOPE_COOKIE, accountScope(claims.userId), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

  /*
   * And a third, for the same §4.10 reason: the shop's header cannot ask the
   * server who is signed in, but a member of staff standing in the storefront
   * should be one click from the back office rather than typing `/admin`.
   *
   * Set, or actively cleared, on every sign-in — otherwise a customer signing
   * in on the shop laptop after the manager would inherit a dashboard link.
   * It is a hint and not a permission: `requireStaff` re-reads the user from
   * the database, so a forged cookie draws a link to a login page.
   */
  if (isStaff(claims)) {
    jar.set(STAFF_HINT_COOKIE, STAFF_HINT_VALUE, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    });
  } else {
    jar.delete(STAFF_HINT_COOKIE);
  }
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(ACCOUNT_SCOPE_COOKIE);
  jar.delete(STAFF_HINT_COOKIE);
}

/** The current session, or null. Never throws — a bad cookie is just no one. */
export async function getSession(): Promise<SessionClaims | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, secret());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : payload.email,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

/** True when the session belongs to someone who may open the admin. */
export function isStaff(session: SessionClaims | null): boolean {
  return session?.role === Role.ADMIN || session?.role === Role.STAFF;
}
