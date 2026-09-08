import type { Metadata } from "next";
import { AuthShell } from "@/app/account/auth-shell";
import { ResetPasswordForm } from "@/app/account/auth-forms";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/account/reset-password">) {
  const { token } = await searchParams;

  return (
    <AuthShell
      eyebrow="Your account"
      title="Choose a new password"
      standfirst="The link works once, and expires an hour after it was sent."
    >
      <ResetPasswordForm token={typeof token === "string" ? token : ""} />
    </AuthShell>
  );
}
