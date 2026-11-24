import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, ContentSection } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "Privacy Policy — how Garidekho handles your data",
  description: "Pakistan-focused privacy policy explaining OTP phone verification, listing data, cookies, retention and your rights over personal information on Garidekho.",
  alternates: { canonical: "/privacy-policy" },
  robots: { index: true, follow: true },
};

const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@garidekho.com.pk";

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="This policy explains what Garidekho collects, why we collect it, how long we keep it and what you can ask us to do with it. It applies to garidekho.com.pk and our related services."
        breadcrumb={[{ label: "Privacy policy", href: "/privacy-policy" }]}
      />

      <div className="container-gdk max-w-4xl space-y-10 py-10 lg:py-14">
        <p className="text-xs font-medium text-ink-500">Last reviewed: November 2026 · Questions: <a href={`mailto:${email}?subject=${encodeURIComponent("Privacy question")}`} className="font-semibold text-link hover:underline dark:text-link-soft">{email}</a></p>

        <ContentSection title="1. Information we collect">
          <p><strong>Account and identity data:</strong> email address, password hash, phone number, profile details and the verification status of your email, phone and identity.</p>
          <p><strong>OTP and verification data:</strong> when you request a code, we store a hashed one-time code, the phone identifier, attempt count, expiry time and verification timestamp. The code itself is delivered by SMS and is never stored in plain text.</p>
          <p><strong>Listing data:</strong> vehicle details, asking price, description, photos, city and area, seller type, and the contact details you choose to publish. Buyer inquiries, messages, favourites, comparisons, reports and reviews are also stored where you use those features.</p>
          <p><strong>Technical data:</strong> IP address, browser user agent, referrer, pages viewed and timestamps in server logs and listing-view records, used for security, abuse prevention and understanding which listings are useful.</p>
          <p><strong>Dealer data:</strong> business name, address, phone, email and verification documents or status where a business applies for a dealer account.</p>
        </ContentSection>

        <ContentSection title="2. Why we use your information">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Create and secure your account, deliver SMS OTP codes and confirm phone ownership.</li>
            <li>Publish, moderate and promote listings, and show the seller information you have chosen to make public.</li>
            <li>Relay inquiries between buyers and sellers, and let support respond to reports and disputes.</li>
            <li>Detect fraud, duplicate listings, fake documents and abuse of the marketplace.</li>
            <li>Operate calculators and valuation tools using aggregate listing data; these tools do not require a separate data collection.</li>
            <li>Comply with applicable Pakistani law, including the Prevention of Electronic Crimes Act 2016, and enforce our <Link href="/terms-of-use" className="font-semibold text-link hover:underline dark:text-link-soft">Terms of Use</Link>.</li>
          </ul>
          <p>We do not sell your personal data. We do not use your identity documents for advertising.</p>
        </ContentSection>

        <ContentSection title="3. Phone numbers, OTP and seller contact">
          <p>
            A phone number is used to send a six-digit verification code. Codes expire after 10 minutes and attempts are
            limited. If you verify successfully, the verified timestamp is recorded on your profile. Sellers choose
            whether their phone number appears on a listing; when it is hidden, buyers contact them through the platform.
          </p>
          <p>
            Never share an OTP with anyone. Garidekho staff will not ask for it by phone, email or message.
          </p>
        </ContentSection>

        <ContentSection title="4. Cookies and local storage">
          <p>
            Essential cookies keep you signed in and protect sessions. Preference cookies remember choices such as theme
            and listing filters. Analytics, where enabled, measures aggregate page usage. You can block or delete cookies
            in your browser; some signed-in features may then stop working. We do not use third-party advertising trackers
            that sell your browsing history.
          </p>
        </ContentSection>

        <ContentSessionToc />

        <ContentSection title="5. Retention">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>OTP records: kept only until verification or expiry, then retained briefly in security logs where needed to investigate abuse.</li>
            <li>Active sessions: expire according to the session policy (30 days by default) and can be revoked by signing out.</li>
            <li>Listings: kept while active; expired, sold or removed listings are retained in a limited state for moderation history and dispute handling.</li>
            <li>Messages, inquiries and reports: retained for the duration of the transaction and a reasonable period afterwards for safety and legal compliance.</li>
            <li>Deleted accounts: personal profile data is removed or anonymised on request, except records we must keep under law or for an active dispute.</li>
          </ul>
        </ContentSection>

        <ContentSection title="6. Sharing">
          <p>
            Information is shared only with the seller or buyer involved in a transaction, service providers that operate
            our infrastructure, SMS and email delivery, and image storage, and with authorities where required by law or
            to protect users from fraud. Dealer business contact details shown on verified storefronts are public by design.
          </p>
        </ContentSection>

        <ContentSection title="7. Your rights and choices">
          <p>
            You may ask to access, correct or delete your personal information, withdraw consent for optional processing,
            request a copy of your listing data, or complain about how a request was handled. Send a message to
            <a href={`mailto:${email}?subject=${encodeURIComponent("Data rights request")}`} className="font-semibold text-link hover:underline dark:text-link-soft"> {email}</a> with the account identifier you use.
            We will verify your identity before acting and respond within a reasonable time. You also have any rights
            available under applicable Pakistani law and can escalate a complaint to the relevant authority.
          </p>
          <p>
            To change a published phone number or remove a listing, sign in and edit the listing, or contact support if
            you no longer have account access.
          </p>
        </ContentSection>

        <ContentSection title="8. Changes to this policy">
          <p>
            We update this policy when our data practices change. Material changes will be highlighted on the site. The
            current version is always available at <Link href="/privacy-policy" className="font-semibold text-link hover:underline dark:text-link-soft">/privacy-policy</Link>.
          </p>
        </ContentSection>
      </div>
    </>
  );
}

function ContentSessionToc() {
  return (
    <nav className="rounded-xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900" aria-label="On this page">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-400">In this policy</p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-600 dark:text-ink-300">
        <span>Information collected</span><span>Use of data</span><span>OTP &amp; contacts</span>
        <span>Cookies</span><span>Retention</span><span>Sharing</span><span>Your rights</span>
      </div>
    </nav>
  );
}
