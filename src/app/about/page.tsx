import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Building2, Eye, ShieldCheck, Users } from "lucide-react";
import { PageHero, ContentSection } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "About Garidekho — Pakistan's automotive marketplace",
  description: "Learn why Garidekho exists, how we moderate listings and verify sellers, and how our marketplace teams work to make buying and selling vehicles in Pakistan safer.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Garidekho",
    description: "A Pakistani automotive marketplace built around verified sellers, moderated listings and transparent decisions.",
    url: "/about",
    type: "website",
  },
};

const principles = [
  {
    icon: ShieldCheck,
    title: "Verified before visible",
    text: "Phone numbers are confirmed with a one-time code, seller accounts are checked, and listings are reviewed before they appear in search.",
  },
  {
    icon: Eye,
    title: "Honest, complete listings",
    text: "We ask sellers for real photos, accurate mileage, service history and a clear description so buyers can compare like with like.",
  },
  {
    icon: BadgeCheck,
    title: "Dealer accountability",
    text: "Businesses apply separately, provide contact details and are reviewed before their storefront and listings are marked verified.",
  },
];

const teams = [
  { name: "Marketplace Operations", role: "Onboarding categories, makes, models and city coverage; keeping taxonomy accurate." },
  { name: "Trust & Safety / Moderation", role: "Reviewing new and edited listings, handling reports and removing misleading or prohibited content." },
  { name: "Dealer Partnerships", role: "Reviewing dealer applications, plans and verification status for business sellers." },
  { name: "Product & Engineering", role: "Maintaining search, mobile experience, calculators, valuation tools and platform reliability." },
  { name: "Customer Support", role: "Answering inquiries, guiding buyers and sellers through verification and disputes." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="A better way to buy and sell vehicles in Pakistan"
        description="Garidekho is a Pakistani automotive marketplace built to make vehicle transactions transparent: real listings, verified sellers and practical tools to help you decide."
        breadcrumb={[{ label: "About", href: "/about" }]}
      />

      <div className="container-gdk space-y-12 py-10 lg:py-14">
        <ContentSection title="Our story">
          <p>
            Buying a car in Pakistan has traditionally meant trusting a phone number from a newspaper ad, travelling to
            see a vehicle that may not match the description, and negotiating without a reliable reference price.
            Garidekho was created to replace that uncertainty with a structured marketplace.
          </p>
          <p>
            We bring private owners, verified dealers and buyers into one place where listings are categorised by vehicle
            type, make, model, year, mileage and city. Moderation happens before publication, and buyers can use our
            <Link href="/estimate" className="font-semibold text-link hover:underline dark:text-link-soft"> market estimator</Link>,
            <Link href="/emi-calculator" className="font-semibold text-link hover:underline dark:text-link-soft"> EMI calculator</Link> and
            <Link href="/inspection" className="font-semibold text-link hover:underline dark:text-link-soft"> inspection service</Link> before
            committing money.
          </p>
        </ContentSection>

        <ContentSection title="Our mission">
          <p>
            Our mission is to make every vehicle transaction in Pakistan more transparent than the last: clear pricing,
            accountable sellers, useful data and a support team that responds. We measure our work by the quality of the
            listings we publish and the confidence buyers feel when they contact a seller.
          </p>
          <div className="grid gap-4 pt-2 sm:grid-cols-3">
            {principles.map(({ icon: Icon, title, text }) => (
              <div key={title} className="surface-card rounded-xl p-5">
                <Icon className="size-6 text-link" />
                <h3 className="mt-3 text-sm font-bold text-ink-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-600 dark:text-ink-300">{text}</p>
              </div>
            ))}
          </div>
        </ContentSection>

        <ContentSection title="Our approach to trust">
          <p>
            Trust is a process, not a badge. A seller verifies a phone number through an SMS one-time code, completes a
            listing with structured vehicle details, and submits it for review. Our moderation team checks the content
            against marketplace rules. Dealers complete a separate verification workflow before their business identity
            is shown as verified.
          </p>
          <p>
            Buyers are never asked to send money to Garidekho for a privately listed vehicle. Payments between buyer and
            seller happen directly, and we publish guidance on safe meetings, document checks and independent inspections.
            Suspicious listings can be reported from the listing page and are reviewed by our team.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/verification" className="inline-flex h-10 items-center rounded-xl bg-cta px-4 text-sm font-semibold text-white hover:bg-cta-hover">How verification works</Link>
            <Link href="/help" className="inline-flex h-10 items-center rounded-xl border border-ink-200 px-4 text-sm font-semibold hover:border-link hover:text-link dark:border-ink-700">Help center</Link>
          </div>
        </ContentSection>

        <ContentSection title="How our team is structured">
          <p>We organise responsibility by function rather than by individual personality, so every request has a clear owner:</p>
          <div className="grid gap-4 pt-2 sm:grid-cols-2">
            {teams.map((team) => (
              <div key={team.name} className="flex gap-3 rounded-xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
                <Users className="mt-0.5 size-4 shrink-0 text-link" />
                <div>
                  <h3 className="text-sm font-bold text-ink-900 dark:text-white">{team.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">{team.role}</p>
                </div>
              </div>
            ))}
          </div>
        </ContentSection>

        <ContentSection title="Where we operate">
          <p>
            Our marketplace is built for Pakistan, with location data covering provinces and cities from Karachi and
            Lahore to Quetta, Peshawar and Islamabad. Browse <Link href="/cities" className="font-semibold text-link hover:underline dark:text-link-soft">all cities</Link> or
            <Link href="/brands" className="font-semibold text-link hover:underline dark:text-link-soft"> all brands</Link> to see how the
            catalogue is organised.
          </p>
          <p className="flex items-center gap-2">
            <Building2 className="size-4 text-link" />
            Questions about the platform? <Link href="/contact" className="font-semibold text-link hover:underline dark:text-link-soft">Contact our team</Link>.
          </p>
        </ContentSection>
      </div>
    </>
  );
}
