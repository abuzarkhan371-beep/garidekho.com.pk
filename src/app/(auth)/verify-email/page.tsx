import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CircleAlert } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { verifyEmailAction } from "../actions";

export const metadata: Metadata = { title: "Verify email", robots: { index: false, follow: false } };

export default async function VerifyEmailPage({
  searchParams,
}: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const verified = token ? await verifyEmailAction(token) : false;

  return (
    <AuthShell
      title={verified ? "Email verified" : "Verification failed"}
      subtitle={verified ? "Your email address is confirmed and your account is ready." : "This verification link is invalid or has expired."}
      footer={<Link href="/dashboard" className="font-semibold text-link hover:underline dark:text-link-soft">Go to dashboard</Link>}
    >
      <div className="flex flex-col items-center py-6 text-center">
        {verified ? (
          <BadgeCheck className="size-12 text-link" />
        ) : (
          <CircleAlert className="size-12 text-red-600" />
        )}
        <p className="mt-4 text-sm text-ink-500">
          {verified ? "Thanks for confirming your address." : "Request a new verification email from your account settings."}
        </p>
      </div>
    </AuthShell>
  );
}
