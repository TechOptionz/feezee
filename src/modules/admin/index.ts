import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma, Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession, type SessionClaims } from "@/modules/customers/session";

/**
 * Who may open the admin, and what they did while they were in it.
 *
 * The guard re-reads the user from the database rather than trusting the role
 * in the session cookie. The cookie is signed, so the claim cannot be forged —
 * but it was minted when the person signed in, and someone demoted from ADMIN
 * an hour ago would otherwise keep admin rights until their token expired.
 * One indexed lookup per admin page view is a cheap way to make a revocation
 * take effect immediately.
 */

export type Actor = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export class ForbiddenError extends Error {
  constructor(message = "You do not have access to that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

async function verify(session: SessionClaims | null): Promise<Actor | null> {
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user || user.role === Role.CUSTOMER) return null;
  return user;
}

/** The signed-in staff member, or null. Does not redirect. */
export async function currentActor(): Promise<Actor | null> {
  return verify(await getSession());
}

/**
 * Guard an admin page. Redirects to the admin login rather than throwing, so an
 * expired session lands somewhere useful instead of on an error page.
 */
export async function requireStaff(returnTo?: string): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/admin/login${next}`);
  }
  return actor;
}

/** Guard something only a full administrator may do. */
export async function requireAdmin(returnTo?: string): Promise<Actor> {
  const actor = await requireStaff(returnTo);
  if (actor.role !== Role.ADMIN) {
    throw new ForbiddenError("That action is restricted to administrators.");
  }
  return actor;
}

/** The same check for a server action, which should fail rather than redirect. */
export async function requireStaffAction(): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) throw new ForbiddenError("Please sign in again.");
  return actor;
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export type AuditInput = {
  actor: Actor | null;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: unknown;
  newState?: unknown;
};

/**
 * Record an administrative action.
 *
 * Never throws. An audit write that fails must not take the operation with it —
 * an order that shipped but was not logged is a gap in the record; an order
 * that failed to ship because the logging broke is a parcel that never went
 * out. The failure is reported to the server console instead.
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    const ip = await clientIp();
    await prisma.auditLog.create({
      data: {
        userId: input.actor?.id ?? null,
        userEmail: input.actor?.email ?? "system",
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        previousState: toJson(input.previousState),
        newState: toJson(input.newState),
        ipAddress: ip,
      },
    });
  } catch (error) {
    console.error("[audit] failed to record", input.action, error);
  }
}

/** Prisma's Json column will not take `undefined`, a Decimal or a Date. */
function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return undefined;
  }
}

async function clientIp(): Promise<string | null> {
  try {
    const list = await headers();
    const forwarded = list.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]!.trim();
    return list.get("x-real-ip");
  } catch {
    return null;
  }
}

export type AuditFilter = {
  search?: string;
  entityType?: string;
  take?: number;
  skip?: number;
};

export async function listAuditLogs(filter: AuditFilter = {}) {
  const where: Prisma.AuditLogWhereInput = {
    ...(filter.entityType ? { entityType: filter.entityType } : {}),
    ...(filter.search
      ? {
          OR: [
            { userEmail: { contains: filter.search, mode: "insensitive" } },
            { action: { contains: filter.search, mode: "insensitive" } },
            { entityId: { contains: filter.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filter.take ?? 100,
      skip: filter.skip ?? 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    total,
    logs: rows.map((row) => ({
      id: row.id,
      userEmail: row.userEmail,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      previousState: row.previousState,
      newState: row.newState,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

/** The entity types present in the log, for the filter dropdown. */
export async function auditEntityTypes(): Promise<string[]> {
  const rows = await prisma.auditLog.findMany({
    distinct: ["entityType"],
    select: { entityType: true },
    orderBy: { entityType: "asc" },
  });
  return rows.map((r) => r.entityType);
}
