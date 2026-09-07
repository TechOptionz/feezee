"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AuthError,
  addressSchema,
  changePassword,
  deleteAddress,
  loginSchema,
  login,
  logout,
  register,
  registerSchema,
  requestPasswordReset,
  resetPassword,
  saveAddress,
  setDefaultAddress,
  updateProfile,
} from "@/modules/customers";
import { getSession } from "@/modules/customers/session";
import { requestReturn } from "@/modules/returns";
import {
  passwordResetEmail,
  returnUpdateEmail,
  sendEmail,
  sendEmailInBackground,
} from "@/modules/notifications";
import { site } from "@/lib/site";
import { prisma } from "@/lib/prisma";

/**
 * Everything a signed-in customer can do to their own account.
 *
 * Every action here reads the user id from the session cookie, never from the
 * form. An address id or an order id arriving from the browser is only ever
 * used *together with* that session id, so a guessed id belonging to someone
 * else matches nothing.
 */

export type FormState = {
  status: "idle" | "error" | "ok";
  message?: string;
  fieldErrors?: Record<string, string>;
};

/** Zod issues, flattened to one message per field. */
function fieldErrorsFrom(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

function fail(error: unknown): FormState {
  if (error instanceof AuthError) {
    return { status: "error", message: error.message };
  }
  console.error("[account]", error);
  return { status: "error", message: "Something went wrong. Please try again." };
}

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/account/login");
  return session.userId;
}

// ---------------------------------------------------------------------------
// Sign in, register, sign out
// ---------------------------------------------------------------------------

export async function loginAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await login(parsed.data);
  } catch (error) {
    return fail(error);
  }

  const next = String(formData.get("next") ?? "/account");
  // Only ever a path on this site — an open redirect here would be a phishing
  // link that genuinely came from our own login form.
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/account");
}

export async function registerAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await register(parsed.data);
  } catch (error) {
    return fail(error);
  }

  redirect("/account");
}

export async function logoutAction() {
  await logout();
  redirect("/");
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function forgotPasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { status: "error", fieldErrors: { email: "Enter your email address." } };
  }

  try {
    const result = await requestPasswordReset(email);
    if (result) {
      await sendEmail({
        to: result.user.email,
        ...passwordResetEmail({
          customerName: result.user.name,
          resetUrl: `${site.url}/account/reset-password?token=${result.token}`,
        }),
      });
    }
  } catch (error) {
    console.error("[account] reset request", error);
  }

  /*
   * The same answer whether or not the address has an account. Saying "no
   * account with that email" would turn this form into a way of discovering
   * who shops here.
   */
  return {
    status: "ok",
    message:
      "If that email has an account, a reset link is on its way. It expires in an hour.",
  };
}

export async function resetPasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password !== confirm) {
    return { status: "error", fieldErrors: { confirm: "The two passwords do not match." } };
  }

  try {
    await resetPassword(token, password);
  } catch (error) {
    return fail(error);
  }

  redirect("/account/login?reset=1");
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function updateProfileAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  try {
    await updateProfile(userId, {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? "") || null,
    });
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/account");
  return { status: "ok", message: "Saved." };
}

export async function changePasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const next = String(formData.get("newPassword") ?? "");
  if (next !== String(formData.get("confirm") ?? "")) {
    return { status: "error", fieldErrors: { confirm: "The two passwords do not match." } };
  }

  try {
    await changePassword(userId, String(formData.get("currentPassword") ?? ""), next);
  } catch (error) {
    return fail(error);
  }
  return { status: "ok", message: "Your password has been changed." };
}

// ---------------------------------------------------------------------------
// Address book
// ---------------------------------------------------------------------------

export async function saveAddressAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();

  const parsed = addressSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    emirate: formData.get("emirate"),
    city: formData.get("city"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2") || "",
    landmark: formData.get("landmark") || "",
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    const id = String(formData.get("addressId") ?? "");
    await saveAddress(userId, parsed.data, id || undefined);
  } catch (error) {
    return fail(error);
  }

  revalidatePath("/account/addresses");
  return { status: "ok", message: "Address saved." };
}

export async function deleteAddressAction(formData: FormData) {
  const userId = await requireUserId();
  await deleteAddress(userId, String(formData.get("addressId") ?? ""));
  revalidatePath("/account/addresses");
}

export async function setDefaultAddressAction(formData: FormData) {
  const userId = await requireUserId();
  await setDefaultAddress(userId, String(formData.get("addressId") ?? ""));
  revalidatePath("/account/addresses");
}

// ---------------------------------------------------------------------------
// Returns
// ---------------------------------------------------------------------------

export async function requestReturnAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const orderId = String(formData.get("orderId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!reason) {
    return { status: "error", fieldErrors: { reason: "Tell us why it is coming back." } };
  }

  /*
   * The chosen pieces arrive as `item:<orderItemId>` = quantity. Read off the
   * form rather than trusted: `requestReturn` checks every id belongs to the
   * order, and every quantity to what was actually bought.
   */
  const items: { orderItemId: string; quantity: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("item:")) continue;
    const quantity = Number(value);
    if (Number.isFinite(quantity) && quantity > 0) {
      items.push({ orderItemId: key.slice(5), quantity });
    }
  }

  if (items.length === 0) {
    return { status: "error", message: "Choose at least one piece to return." };
  }

  try {
    const created = await requestReturn(
      {
        orderId,
        reason,
        customerNotes: String(formData.get("customerNotes") ?? "") || undefined,
        items,
      },
      userId,
    );

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, customerName: true, customerEmail: true },
    });

    if (order) {
      sendEmailInBackground({
        to: order.customerEmail,
        ...returnUpdateEmail({
          returnNumber: created.returnNumber,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          status: "PENDING",
        }),
      });
    }
  } catch (error) {
    return fail(error);
  }

  revalidatePath("/account/returns");
  redirect("/account/returns");
}
