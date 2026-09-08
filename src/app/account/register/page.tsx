import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/app/account/auth-shell";
import { RegisterForm } from "@/app/account/auth-forms";
import { getSession } from "@/modules/customers/session";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getSession()) redirect("/account");

  return (
    <AuthShell
      eyebrow="Your account"
      title="Create an account"
      standfirst="Keep your order history, save a delivery address, and check out in one step next time."
    >
      <RegisterForm />
    </AuthShell>
  );
}
