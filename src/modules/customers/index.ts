import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { Prisma, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { EMIRATES, normaliseUaePhone } from "@/modules/checkout";
import { createSession, destroySession, getSession } from "@/modules/customers/session";

export * from "@/modules/customers/session";

/**
 * Customers: registering, signing in, and the address book.
 *
 * Two rules run through the whole file:
 *
 * 1. **A password is never stored, compared or logged in the clear.** bcrypt at
 *    cost 12, and comparison only ever through `bcrypt.compare`.
 * 2. **Failure never says which half was wrong.** "No account with that email"
 *    tells an attacker which addresses are worth guessing passwords for, so
 *    both cases return the same sentence.
 */

const BCRYPT_ROUNDS = 12;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(200, "That password is too long."),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? normaliseUaePhone(v) : null)),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

const CREDENTIALS_REJECTED = "That email and password do not match.";

export type CustomerView = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  createdAt: string;
};

function toCustomerView(row: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  createdAt: Date;
}): CustomerView {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Create a customer and sign them in. */
export async function register(
  input: z.output<typeof registerSchema>,
): Promise<CustomerView> {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AuthError(
      "There is already an account with that email. Try signing in instead.",
    );
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: input.name,
      phone: input.phone,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      role: Role.CUSTOMER,
    },
  });

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return toCustomerView(user);
}

/**
 * Sign in.
 *
 * `expect` lets the admin login refuse a customer account without leaking that
 * the credentials were otherwise correct — a wrong door and a wrong password
 * look identical from outside.
 */
export async function login(
  input: z.output<typeof loginSchema>,
  expect: "any" | "staff" = "any",
): Promise<CustomerView> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  /*
   * Hash against a throwaway even when there is no such user. Skipping it would
   * make "no account" measurably faster to answer than "wrong password", which
   * turns the login form into an account-enumeration oracle.
   */
  const hash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const ok = await bcrypt.compare(input.password, hash);

  if (!user || !ok) throw new AuthError(CREDENTIALS_REJECTED);

  if (expect === "staff" && user.role === Role.CUSTOMER) {
    throw new AuthError(CREDENTIALS_REJECTED);
  }

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return toCustomerView(user);
}

export async function logout(): Promise<void> {
  await destroySession();
}

/** The signed-in customer, freshly read. Null when nobody is signed in. */
export async function currentUser(): Promise<CustomerView | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  return user ? toCustomerView(user) : null;
}

export async function updateProfile(
  userId: string,
  input: { name?: string; phone?: string | null },
): Promise<CustomerView> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.phone !== undefined
        ? { phone: input.phone ? normaliseUaePhone(input.phone) : null }
        : {}),
    },
  });
  return toCustomerView(user);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new AuthError("Your current password is not right.");
  }
  if (newPassword.length < 8) {
    throw new AuthError("Use at least 8 characters.");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) },
  });
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

const RESET_TTL_MS = 1000 * 60 * 60; // one hour

/**
 * Begin a reset.
 *
 * Returns the raw token for the email, and stores only its SHA-256 — a stolen
 * database dump then contains no usable reset links. Always resolves, even for
 * an address with no account, so the form cannot be used to discover who
 * shops here.
 */
export async function requestPasswordReset(
  email: string,
): Promise<{ token: string; user: CustomerView } | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user) return null;

  const token = randomBytes(32).toString("base64url");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: createHash("sha256").update(token).digest("hex"),
      resetTokenExpiry: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  return { token, user: toCustomerView(user) };
}

/** Finish a reset. The token is single-use: it is cleared on success. */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  if (newPassword.length < 8) throw new AuthError("Use at least 8 characters.");

  const hashed = createHash("sha256").update(token).digest("hex");
  const user = await prisma.user.findFirst({
    where: { resetToken: hashed, resetTokenExpiry: { gt: new Date() } },
  });
  if (!user) {
    throw new AuthError("That reset link has expired. Please ask for a new one.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
      resetToken: null,
      resetTokenExpiry: null,
    },
  });
}

// ---------------------------------------------------------------------------
// Address book
// ---------------------------------------------------------------------------

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the full name for the parcel."),
  phone: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const normalised = normaliseUaePhone(value);
      if (!normalised) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a UAE mobile, e.g. +971 50 123 4567.",
        });
        return z.NEVER;
      }
      return normalised;
    }),
  emirate: z.enum(EMIRATES, { message: "Choose an emirate." }),
  city: z.string().trim().min(2, "Enter the area or city."),
  addressLine1: z.string().trim().min(4, "Enter the street, building or villa."),
  addressLine2: z.string().trim().max(160).optional().or(z.literal("")),
  landmark: z.string().trim().max(160).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.output<typeof addressSchema>;

export type AddressView = {
  id: string;
  fullName: string;
  phone: string;
  emirate: string;
  city: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  isDefault: boolean;
};

function toAddressView(row: {
  id: string;
  fullName: string;
  phone: string;
  emirate: string;
  city: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  isDefault: boolean;
}): AddressView {
  return { ...row };
}

export async function listAddresses(userId: string): Promise<AddressView[]> {
  const rows = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toAddressView);
}

/**
 * Save an address.
 *
 * "Default" is exclusive, so clearing the old one and setting the new one
 * happen in a single transaction — two defaults would make the checkout pick
 * arbitrarily, and no default would make it pick nothing.
 */
export async function saveAddress(
  userId: string,
  input: AddressInput,
  addressId?: string,
): Promise<AddressView> {
  return prisma.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId } });
    const isDefault = input.isDefault || count === 0;

    if (isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const data: Prisma.AddressUncheckedCreateInput = {
      userId,
      fullName: input.fullName,
      phone: input.phone,
      emirate: input.emirate,
      city: input.city,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2 || null,
      landmark: input.landmark || null,
      isDefault,
    };

    if (addressId) {
      const owned = await tx.address.findFirst({
        where: { id: addressId, userId },
        select: { id: true },
      });
      if (!owned) throw new AuthError("That address is not yours to edit.");
      return toAddressView(
        await tx.address.update({ where: { id: addressId }, data }),
      );
    }

    return toAddressView(await tx.address.create({ data }));
  });
}

export async function deleteAddress(userId: string, addressId: string) {
  // Scoped by userId as well as id, so a guessed id deletes nothing.
  await prisma.address.deleteMany({ where: { id: addressId, userId } });
}

export async function setDefaultAddress(userId: string, addressId: string) {
  await prisma.$transaction(async (tx) => {
    const owned = await tx.address.findFirst({
      where: { id: addressId, userId },
      select: { id: true },
    });
    if (!owned) throw new AuthError("That address is not yours.");
    await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    await tx.address.update({ where: { id: addressId }, data: { isDefault: true } });
  });
}

// ---------------------------------------------------------------------------
// The admin's view of customers
// ---------------------------------------------------------------------------

export type CustomerSummary = CustomerView & {
  orderCount: number;
  totalSpentAed: number;
  lastOrderAt: string | null;
};

/** Customer directory with lifetime value, biggest spender first. */
export async function customerDirectory(search?: string): Promise<CustomerSummary[]> {
  const users = await prisma.user.findMany({
    where: {
      role: Role.CUSTOMER,
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      orders: {
        where: { fulfillmentStatus: { not: "CANCELLED" } },
        select: { totalAed: true, placedAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return users
    .map((user) => ({
      ...toCustomerView(user),
      orderCount: user.orders.length,
      totalSpentAed: user.orders.reduce(
        (sum, order) => sum + Number(order.totalAed),
        0,
      ),
      lastOrderAt:
        user.orders
          .map((o) => o.placedAt)
          .sort((a, b) => b.getTime() - a.getTime())[0]
          ?.toISOString() ?? null,
    }))
    .sort((a, b) => b.totalSpentAed - a.totalSpentAed);
}
