import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Building2, Fingerprint, PhoneCall } from "lucide-react";
import { PageHero, ContentSection } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "Verification Levels — phone, identity and dealer checks",
  description: "Understand Garidekho's phone OTP, identity and dealer verification levels, what each badge means, and how to complete each step.",
  alternates: { canonical: "/verification" },
};

const levels = [
  {
    icon: PhoneCall,
    name: "Phone verification",
    status: "SMS OTP",
    text: "You enter your mobile number and receive a six-digit one-time code. The code expires after 10 minutes and attempts are limited. A successful check records a verified timestamp on your profile; the code itself is stored only as a hash.",
    action: { label: "Verify your phone", href: "/verify-phone" },
  },
  {
    icon: Fingerprint,
    name: "Identity verification",
    status: "Profile status",
    text: "Where requested, identity review is tracked on your profile as unverified, pending, verified or rejected. It is separate from phone OTP verification and may be required for higher-risk transactions or dealer accounts. We ask only for information needed for the check.",
    action: { label: "Read privacy policy", href: "/privacy-policy" },
  },
  {
    icon: Building2,
    name: "Dealer verification",
    status: "Business review",
    text: "Businesses apply through the dealer portal with a real business name, contact details and location. Our team reviews the application and marks the storefront verified only after the check is complete. A verified dealer still needs to list each vehicle accurately.",
    action: { label: "Dealer portal", href: "/dealer" },
  },
];

export default function VerificationPage() {
  return (
    <>
      <PageHero
        eyebrow="Trust & safety"
        title="What our verification badges mean"
        description="Verification on Garidekho happens in levels. Each one confirms a specific thing — none of them replaces inspecting the vehicle or checking its documents."
        breadcrumb={[{ label: "Verification", href: "/verification" }]}
      />

      <div className="container-gdk space-y-10 py-10 lg:py-14">
        <div className="grid gap-5 lg:grid-cols-3">
          {levels.map(({ icon: Icon, name, status, text, action }) => (
            <section key={name} className="surface-card flex flex-col rounded-xl p-6">
              <Icon className="size-6 text-link" />
              <div className="mt-4 flex items-center gap-2">
                <h2 className="font-display text-lg font-bold">{name}</h2>
                <BadgeCheck className="size-4 text-link" />
              </div>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-link dark:text-link-soft">{status}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{text}</p>
              <Link href={action.href} className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800 dark:bg-link dark:text-ink-950">
                {action.label}
              </Link>
            </section>
          ))}
        </div>

        <ContentSection title="How to complete phone verification">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Sign in or register with your mobile number.</li>
            <li>Request a code from the <Link href="/verify-phone" className="font-semibold text-link hover:underline dark:text-link-soft">phone verification page</Link>.</li>
            <li>Enter the six-digit code before it expires. Do not share it with anyone — Garidekho staff never ask for it.</li>
            <li>Once verified, your profile records the verification date and your listings can show the verified badge where applicable.</li>
          </ol>
        </ContentSection>

        <ContentSection title="What verification does not cover">
          <p>
            A phone or identity check confirms the account holder, not the condition, ownership history or legal status of
            a vehicle. Always match the registration documents to the seller, inspect the chassis and engine numbers, and
            consider an <Link href="/inspection" className="font-semibold text-link hover:underline dark:text-link-soft">independent inspection</Link>. Report any listing that
            misuses a verification badge through <Link href="/contact" className="font-semibold text-link hover:underline dark:text-link-soft">our contact channels</Link>.
          </p>
        </ContentSection>
      </div>
    </>
  );
}
