import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Mail, MessageSquare, Phone, ShieldAlert, Store } from "lucide-react";
import { PageHero, ContentSection } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "Contact Garidekho — support, sales and moderation",
  description: "Contact Garidekho support by email or phone. Find the right department for listings, verification, dealer plans and safety reports, plus support hours in Pakistan Standard Time.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact Garidekho", description: "Reach the right team for support, dealer sales or safety reports.", url: "/contact", type: "website" },
};

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@garidekho.com.pk";
const salesEmail = process.env.NEXT_PUBLIC_SALES_EMAIL ?? supportEmail;
const safetyEmail = process.env.NEXT_PUBLIC_SAFETY_EMAIL ?? supportEmail;
const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "0339 000 9 333";

const departments = [
  {
    icon: MessageSquare,
    title: "Buyer & seller support",
    text: "Help with listings, OTP verification, search and account access.",
    email: supportEmail,
    subject: "Garidekho support request",
  },
  {
    icon: Store,
    title: "Dealer plans & promotions",
    text: "Questions about dealer storefronts, subscriptions and advertising packages.",
    email: salesEmail,
    subject: "Dealer and advertising enquiry",
  },
  {
    icon: ShieldAlert,
    title: "Safety & content reports",
    text: "Report suspicious listings, misleading photos or a suspected scam.",
    email: safetyEmail,
    subject: "Report a suspicious listing",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to the Garidekho team"
        description="We are a remote-first team serving Pakistan's automotive community. Choose a department below, or send an email directly — every option opens your email app with the right subject."
        breadcrumb={[{ label: "Contact", href: "/contact" }]}
      />

      <div className="container-gdk space-y-10 py-10 lg:py-14">
        <div className="grid gap-5 md:grid-cols-3">
          {departments.map(({ icon: Icon, title, text, email, subject }) => (
            <section key={title} className="surface-card flex flex-col rounded-xl p-5">
              <Icon className="size-5 text-link" />
              <h2 className="mt-3 font-display text-base font-bold text-ink-950 dark:text-white">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{text}</p>
              <a
                href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline dark:text-link-soft"
              >
                <Mail className="size-4" /> {email}
              </a>
            </section>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <ContentSection title="Reach us directly">
            <p className="flex items-center gap-2">
              <Mail className="size-4 shrink-0 text-link" />
              <span>General support: <a href={`mailto:${supportEmail}?subject=${encodeURIComponent("Hello Garidekho")}`} className="font-semibold text-link hover:underline dark:text-link-soft">{supportEmail}</a></span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="size-4 shrink-0 text-link" />
              <span>Phone: <a href={`tel:${supportPhone.replace(/[^+\d]/g, "")}`} className="font-semibold text-link hover:underline dark:text-link-soft">{supportPhone}</a></span>
            </p>
            <p className="flex items-start gap-2">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-link" />
              <span>Support desk hours: Monday to Saturday, 9:00 AM – 6:00 PM Pakistan Standard Time. Messages received outside these hours are answered the next working day.</span>
            </p>
            <p>
              For a faster answer, check the <Link href="/help" className="font-semibold text-link hover:underline dark:text-link-soft">help center</Link> first — it covers
              OTP problems, listing moderation, verification and payments.
            </p>
          </ContentSection>

          <ContentSection title="What to include in your message">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>The email or phone number used on your Garidekho account.</li>
              <li>The listing title or URL, if your question is about a specific ad.</li>
              <li>Screenshots for verification or payment issues — please hide CNIC and card details.</li>
              <li>Your city and a phone number where you can be reached during support hours.</li>
            </ul>
            <p className="text-xs text-ink-500">
              Never send full CNIC numbers, OTP codes, passwords or banking credentials by email. Our team will never ask
              for your OTP.
            </p>
          </ContentSection>
        </div>

        <ContentSection title="Office and coverage">
          <p>
            Garidekho operates remotely with contributors across Pakistan. Our marketplace data covers all provinces and
            major cities; see <Link href="/cities" className="font-semibold text-link hover:underline dark:text-link-soft">browse by city</Link> for the
            current list. We do not publish a physical walk-in address, so email and phone are the reliable ways to reach us.
          </p>
        </ContentSection>
      </div>
    </>
  );
}
