"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Camera, Clock3, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpForm } from "@/components/auth/otp-form";
import type { WizardData } from "@/components/sell/sell-wizard";

export function GuestGate({ data: _data }: { data: WizardData }) {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);

  return (
    <AuthShell
      title="Post your ad — no account needed"
      subtitle="Verify your phone number to start. We use it only to confirm you are a real seller; creating a password is optional."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login?next=%2Fsell" className="ml-1 font-semibold text-link hover:underline dark:text-link-soft">Sign in instead</Link>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { icon: Camera, label: "20 photos" },
            { icon: Clock3, label: "5 minutes" },
            { icon: ShieldCheck, label: "No password" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-ink-50 p-3 dark:bg-ink-800/60">
              <item.icon className="mx-auto size-4 text-link" />
              <p className="mt-1.5 text-[0.68rem] font-semibold text-ink-600 dark:text-ink-300">{item.label}</p>
            </div>
          ))}
        </div>

        <OtpForm purpose="GUEST_LISTING_PHONE" onVerified={refresh} />

        <p className="flex items-start gap-2 rounded-lg bg-signal-50 p-3 text-xs leading-relaxed text-link-ink dark:bg-link/10 dark:text-link-soft">
          <BadgeCheck className="mt-0.5 size-4 shrink-0" />
          Your phone number is hashed and never shown publicly. You can create an account later without losing your ad.
        </p>
      </div>
    </AuthShell>
  );
}
