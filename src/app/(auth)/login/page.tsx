import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: true } };

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your listings, messages and saved vehicles."
      footer={<><NewUser /> <Link href="/register" className="ml-1 font-semibold text-link hover:underline dark:text-link-soft">Create an account</Link></>}
    >
      <LoginForm next={next} googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID)} />
    </AuthShell>
  );
}

function NewUser() { return <>New to Garidekho?</>; }
