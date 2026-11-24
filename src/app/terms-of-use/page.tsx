import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, ContentSection } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "Terms of Use — marketplace rules on Garidekho",
  description: "Read the Garidekho marketplace terms for sellers and buyers: accurate listings, prohibited content, moderation, payments, inspections and limitation of liability.",
  alternates: { canonical: "/terms-of-use" },
};

const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@garidekho.com.pk";

export default function TermsOfUsePage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of Use"
        description="These terms govern your use of Garidekho.com.pk. By browsing, registering, posting a listing or contacting a seller, you agree to them."
        breadcrumb={[{ label: "Terms of use", href: "/terms-of-use" }]}
      />

      <div className="container-gdk max-w-4xl space-y-10 py-10 lg:py-14">
        <p className="text-xs font-medium text-ink-500">Last reviewed: November 2026 · Questions: <a href={`mailto:${email}?subject=${encodeURIComponent("Terms question")}`} className="font-semibold text-link hover:underline dark:text-link-soft">{email}</a></p>

        <ContentSection title="1. Who may use the marketplace">
          <p>
            You must be at least 18 years old, or use the marketplace under the supervision of a parent or guardian, and
            must comply with the laws of Pakistan. You are responsible for the accuracy of the information you provide and
            for keeping your account credentials and phone number secure. One person may not maintain multiple accounts to
            evade moderation or contact restrictions.
          </p>
        </ContentSection>

        <ContentSection title="2. Rules for sellers">
          <p>
            Listings must describe a vehicle or part that you own or are authorised to sell. Provide truthful year,
            mileage, price, condition, registration details and recent photographs of the actual item. Disclose accidents,
            flood or salvage history, altered odometers, pending loans or court cases where known. You must respond to
            genuine inquiries and update or remove a listing once the item is sold.
          </p>
          <p>
            Sellers may not publish another person&apos;s contact details, reuse photos from unrelated vehicles, or create
            multiple listings for the same item to push it up search results. Dealer accounts must use their real business
            identity and keep their storefront details current.
          </p>
        </ContentSection>

        <ContentSection title="3. Rules for buyers">
          <p>
            Inspect the vehicle in person, verify documents and registration with the relevant authority, and use an
            independent <Link href="/inspection" className="font-semibold text-link hover:underline dark:text-link-soft">inspection</Link> where possible before
            transferring money. Compare asking prices with our <Link href="/estimate" className="font-semibold text-link hover:underline dark:text-link-soft">market estimate</Link>
            and calculate financing costs with the <Link href="/emi-calculator" className="font-semibold text-link hover:underline dark:text-link-soft">EMI calculator</Link>.
          </p>
          <p>
            Do not use the platform to harass sellers, send bulk automated messages, scrape data, or arrange illegal
            exports. Any payment you make directly to a seller is your own decision and risk.
          </p>
        </ContentSection>

        <ContentSection title="4. Prohibited content">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Stolen vehicles, vehicles with forged registration or chassis numbers, and items under legal dispute.</li>
            <li>Odometer rollback, undisclosed flood or salvage damage, or photos that misrepresent the item.</li>
            <li>Counterfeit parts, restricted items, weapons, drugs, or any content illegal under Pakistani law.</li>
            <li>Fake dealer identities, misleading badges, spam, duplicate ads and unrelated advertisements.</li>
            <li>Requests for advance payment outside the marketplace that use Garidekho&apos;s name to appear trustworthy.</li>
          </ul>
        </ContentSection>

        <ContentSection title="5. Moderation and enforcement">
          <p>
            We review listings before publication and may edit, reject, hide or remove any listing that breaches these
            terms. We may suspend or ban accounts used for fraud, abuse, impersonation or repeated violations, and may
            report suspected criminal activity to the relevant authorities. Reports can be sent to
            <a href={`mailto:${email}?subject=${encodeURIComponent("Marketplace report")}`} className="font-semibold text-link hover:underline dark:text-link-soft"> {email}</a>.
          </p>
          <p>
            Verification badges indicate the checks we actually performed; see our <Link href="/verification" className="font-semibold text-link hover:underline dark:text-link-soft">verification guide</Link>.
            A badge is not a warranty of vehicle condition.
          </p>
        </ContentSection>

        <ContentSection title="6. Fees and payments">
          <p>
            Browsing, posting a basic listing and contacting sellers are free. Optional promotion packages and dealer
            subscriptions are priced from our live catalogue on the <Link href="/pricing" className="font-semibold text-link hover:underline dark:text-link-soft">pricing page</Link>.
            Platform fees, where applicable, are charged through the payment providers we support and are separate from
            the price of the vehicle.
          </p>
          <p>
            Garidekho does not act as an escrow agent for vehicle purchases and does not guarantee refunds for private
            transactions between buyers and sellers. Bank transfers, cash, JazzCash, EasyPaisa or card payments arranged
            between users are their own responsibility.
          </p>
        </ContentSection>

        <ContentSection title="7. Intellectual property">
          <p>
            Listing text, photos and dealer content remain the property of their authors, who grant Garidekho a licence to
            display them for marketplace operation and promotion. The Garidekho name, design and software may not be copied
            or used to imply endorsement without written permission.
          </p>
        </ContentSection>

        <ContentSection title="8. Liability and disclaimers">
          <p>
            Listings are provided by users. We do not warrant that every detail is accurate, that a vehicle is free from
            defects, or that a transaction will complete. Estate agents, dealers and inspections are independent parties.
            To the extent permitted by law, Garidekho is not liable for indirect or consequential losses, lost profits or
            losses arising from a transaction between users.
          </p>
          <p>
            Nothing in these terms limits liability that cannot lawfully be limited under Pakistani law.
          </p>
        </ContentSection>

        <ContentSection title="9. Changes and governing law">
          <p>
            We may update these terms as the marketplace evolves; the current version will always be published at
            <Link href="/terms-of-use" className="font-semibold text-link hover:underline dark:text-link-soft"> /terms-of-use</Link>.
            These terms are governed by the laws of Pakistan. For questions, contact our support team via <Link href="/contact" className="font-semibold text-link hover:underline dark:text-link-soft">/contact</Link>.
          </p>
        </ContentSection>
      </div>
    </>
  );
}
