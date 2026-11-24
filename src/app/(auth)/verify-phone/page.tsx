import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpForm } from "@/components/auth/otp-form";

export const metadata: Metadata = { title: "Verify phone number", robots: { index: false, follow: false } };

export default async function VerifyPhonePage({
  searchParams,
}: { searchParams: Promise<{ purpose?: string }> }) {
  const { purpose } = await searchParams;
  const resolved = purpose === "PHONE_LOGIN" ? "PHONE_LOGIN" : "PHONE_VERIFY";
  return (
    <AuthShell
      title={resolved === "PHONE_LOGIN" ? "Login with OTP" : "Verify your number"}
      subtitle={resolved === "PHONE_LOGIN" ? "Enter your registered mobile number to receive a one-time code." : "A verified number builds trust with buyers and unlocks ad publishing."}
      footer={<p>Valid Pakistani mobile numbers only (+92xxxxxxxxxx).</p>}
    >
      <OtpForm purpose={resolved} />
    </AuthShell>
  );
}
