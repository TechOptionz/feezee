import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/app/account/auth-shell";
import { LoginForm } from "@/app/account/auth-forms";
import { getSession } from "@/modules/customers/session";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: PageProps<"/account/login">) {
  const { next, reset } = await searchParams;
  if (await getSession()) redirect("/account");

  return (
    <AuthShell
      eyebrow="Your account"
      title="Sign in"
      standfirst={
        reset
          ? "Your password has been changed. Sign in with the new one."
          : "Your orders, your saved addresses and the pieces you have hearted."
      }
    >
      <LoginForm next={typeof next === "string" ? next : "/account"} />
    </AuthShell>
  );
}
