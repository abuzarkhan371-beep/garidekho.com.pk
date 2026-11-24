import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default async function ResetPasswordPage({
  searchParams,
}: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Choose a new password" subtitle="Pick a strong password you have not used on this account before.">
      {token ? <ResetPasswordForm token={token} /> : <p className="text-sm text-red-600">Invalid reset link.</p>}
    </AuthShell>
  );
}
