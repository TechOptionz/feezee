import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { Role } from "@prisma/client";

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
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
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
