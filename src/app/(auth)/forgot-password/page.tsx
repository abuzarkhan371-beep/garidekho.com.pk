import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" subtitle="We will email you a secure link to choose a new password.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
