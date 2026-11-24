import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: true } };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Join Garidekho"
      subtitle="Create a free account to post ads, save vehicles and contact sellers."
      footer={<><span>Already have an account?</span> <Link href="/login" className="ml-1 font-semibold text-link hover:underline dark:text-link-soft">Sign in</Link></>}
    >
      <RegisterForm />
    </AuthShell>
  );
}
