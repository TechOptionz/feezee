import type { Metadata } from "next";
import { AuthShell } from "@/app/account/auth-shell";
import { ForgotPasswordForm } from "@/app/account/auth-forms";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Your account"
      title="Reset your password"
      standfirst="Tell us the email on the account and we will send a link to choose a new password."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
