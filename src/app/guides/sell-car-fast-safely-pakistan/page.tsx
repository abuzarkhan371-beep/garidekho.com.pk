import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageHero, ContentSection } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "How to Sell Your Car Fast and Safely in Pakistan",
  description: "An eight-part practical guide to preparing documents, pricing from real listings, photographing your car, verifying your identity, handling buyers, inspecting, transferring ownership and settling payments in Pakistan.",
  alternates: { canonical: "/guides/sell-car-fast-safely-pakistan" },
  openGraph: {
    title: "Sell your car fast and safely in Pakistan",
    description: "A practical eight-section guide for private sellers on Garidekho.",
    url: "/guides/sell-car-fast-safely-pakistan",
    type: "article",
  },
};

export default function SellCarGuidePage() {
  return (
    <>
      <PageHero
        eyebrow="Seller guide"
        title="How to sell your car fast and safely in Pakistan"
        description="A practical, eight-part checklist for private sellers: get your paperwork right, price from real data, screen buyers and complete a clean transfer."
        breadcrumb={[
          { label: "Guides", href: "/help" },
          { label: "Sell safely", href: "/guides/sell-car-fast-safely-pakistan" },
        ]}
      />

      <div className="container-gdk max-w-4xl space-y-10 py-10 lg:py-14">
        <nav className="rounded-xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900" aria-label="Guide contents">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">In this guide</p>
          <ol className="mt-2 grid gap-1 text-sm text-ink-600 sm:grid-cols-2 dark:text-ink-300">
            {[
              "Sort your documents first", "Price from real listings", "Prepare and photograph the car",
              "Write an honest listing", "Verify your identity", "Screen buyers and meet safely",
              "Inspect and transfer ownership", "Settle payment and close the deal",
            ].map((item, index) => (
              <li key={item}><a href={`#section-${index + 1}`} className="hover:text-link dark:hover:text-link-soft">{index + 1}. {item}</a></li>
            ))}
          </ol>
        </nav>

        <ContentSection id="section-1" title="1. Sort your documents first">
          <p>
            Before you take a single photo, gather the original registration book, your CNIC, the vehicle&apos;s chassis and
            engine number record, service history and any loan clearance letter. Check that the registration city and the
            name on the book match your documents. If the car was imported, keep the customs and import papers ready.
          </p>
          <p>
            A buyer will ask why a document is missing. Answer that question in your listing rather than discovering it
            during a test drive. If there is a court case, pending transfer or unpaid finance, resolve it or disclose it
            clearly.
          </p>
        </ContentSection>

        <ContentSection id="section-2" title="2. Price from real listings, not guesswork">
          <p>
            Open the <Link href="/estimate" className="font-semibold text-link hover:underline dark:text-link-soft">market estimator</Link> and select your
            exact make, model, year and mileage. It uses active listings, adjusts for year and mileage and shows every
            comparable. Then browse <Link href="/search" className="font-semibold text-link hover:underline dark:text-link-soft">live search results</Link> for recently
            published ads in your city.
          </p>
          <p>
            Price within the demonstrated range if you want a quick sale. A high asking price &ldquo;to leave room for
            negotiation&rdquo; often means your listing is ignored. If your car is genuinely exceptional, explain why in
            the description with evidence such as dealer service records.
          </p>
        </ContentSection>

        <ContentSection id="section-3" title="3. Prepare and photograph the car">
          <p>
            Wash the car, clean the interior, remove personal items and photograph it in daylight with a plain background.
            Capture front and rear three-quarter views, both sides, the interior, dashboard, odometer, tyres, engine bay
            and any damage. Photos of the actual vehicle build far more trust than stock images.
          </p>
          <p>
            Do not hide rust, dents or a warning light. A buyer who discovers undisclosed damage at your door will either
            walk away or demand a larger discount.
          </p>
        </ContentSection>

        <ContentSection id="section-4" title="4. Write an honest, searchable listing">
          <p>
            Start with make, model, variant, year and mileage so the title is easy to understand. In the description,
            cover service history, tyre and battery condition, modifications, accident or flood history, and the reason
            for sale. Add your city and area so local buyers can find you; see <Link href="/cities" className="font-semibold text-link hover:underline dark:text-link-soft">city pages</Link> for how locations
            are organised.
          </p>
          <p>
            Complete the <Link href="/sell" className="font-semibold text-link hover:underline dark:text-link-soft">posting flow</Link> with real details.
            Incomplete listings take longer to moderate and answer fewer buyer questions. If you want wider reach, check
            the live <Link href="/pricing" className="font-semibold text-link hover:underline dark:text-link-soft">promotion packages</Link> after your listing is approved.
          </p>
        </ContentSection>

        <ContentSection id="section-5" title="5. Verify your phone and identity">
          <p>
            Verify your mobile number through the <Link href="/verify-phone" className="font-semibold text-link hover:underline dark:text-link-soft">OTP flow</Link> before
            answering inquiries. Buyers are more likely to contact a verified seller, and your account recovery depends on
            a working number. Never share your OTP with a buyer, even if they claim to be from Garidekho support.
          </p>
          <p>
            Read <Link href="/verification" className="font-semibold text-link hover:underline dark:text-link-soft">what each verification level means</Link> so you
            can explain your badge accurately. A badge confirms an account check, not vehicle condition.
          </p>
        </ContentSection>

        <ContentSection id="section-6" title="6. Screen buyers and meet safely">
          <p>
            Genuine buyers ask specific questions about the car. Treat requests for &ldquo;booking money&rdquo; before an
            inspection, pressure to move to an unrelated app, or excuses for not visiting as warning signs. Keep early
            communication on the platform where possible.
          </p>
          <p>
            Meet in a public, well-lit location or at your home with a family member present. Bring your documents but
            do not hand over originals. Allow a test drive only with valid insurance and a licence check, and accompany
            the driver.
          </p>
        </ContentSection>

        <ContentSection id="section-7" title="7. Inspect and transfer ownership">
          <p>
            Serious buyers may arrange their own mechanic or request a <Link href="/inspection" className="font-semibold text-link hover:underline dark:text-link-soft">Garidekho inspection</Link>.
            Cooperating with a fair inspection speeds up the decision. Agree in writing who pays for repairs, if any,
            before the transfer.
          </p>
          <p>
            Complete the transfer at the relevant registration office with both parties present. Verify the new
            registration entry, hand over spare keys, tools and service books, and keep copies of everything signed.
          </p>
        </ContentSection>

        <ContentSection id="section-8" title="8. Settle payment and close the deal">
          <p>
            Prefer a traceable payment and confirm cleared funds before handing over the vehicle and original documents.
            If a loan is involved, obtain written confirmation of settlement from the bank. Update your listing immediately
            so no one wastes time on a sold vehicle.
          </p>
          <p>
            Garidekho does not hold vehicle payments in escrow. For disputes or suspicious behaviour, contact us through
            <Link href="/contact" className="font-semibold text-link hover:underline dark:text-link-soft"> /contact</Link> and review the
            <Link href="/terms-of-use" className="font-semibold text-link hover:underline dark:text-link-soft"> Terms of Use</Link>. More answers are in the
            <Link href="/help" className="font-semibold text-link hover:underline dark:text-link-soft"> Help Center</Link>.
          </p>
          <p className="flex items-center gap-2 font-semibold text-link dark:text-link-soft">
            <CheckCircle2 className="size-4" /> Ready to list? <Link href="/sell" className="underline">Start your ad</Link>.
          </p>
        </ContentSection>
      </div>
    </>
  );
}
