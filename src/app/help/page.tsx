import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion, type FaqCategory } from "@/components/content/faq-accordion";
import { PageHero } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "Help Center — answers for buyers, sellers and dealers",
  description: "Find answers about OTP verification, posting and editing listings, moderation, buying safely, dealer plans, payments and account issues on Garidekho.",
  alternates: { canonical: "/help" },
};

const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@garidekho.com.pk";

const faqs: FaqCategory[] = [
  {
    title: "Buying safely",
    description: "Before you travel or transfer money.",
    questions: [
      {
        question: "How do I know a listing is trustworthy?",
        answer: "Look for the verified seller badge, complete vehicle details and multiple real photos. Check that the seller's phone number matches the one shown on the listing, and compare the asking price with our market estimator. A verified badge confirms an identity or phone check, not the mechanical condition of the vehicle.",
      },
      {
        question: "Can Garidekho inspect a car for me?",
        answer: "Yes. You can request an independent inspection with the vehicle details and city through our inspection form. We record the request and follow up using the contact details you provide. Inspections are separate from the purchase price.",
      },
      {
        question: "What should I check before paying?",
        answer: "Verify the registration book and CNIC of the seller, match the chassis and engine numbers, confirm there is no loan or court restriction, take a test drive and have a mechanic inspect the vehicle. Never send an advance payment to someone you have not met simply because they mention Garidekho.",
      },
      {
        question: "How are vehicle prices estimated?",
        answer: "Our estimator filters active listings for the same make and model, adjusts each asking price for model year and mileage, excludes extreme outliers and reports the median. You can see every comparable listing used in the calculation.",
      },
    ],
  },
  {
    title: "Selling & listings",
    description: "Posting, editing and moderation basics.",
    questions: [
      {
        question: "Why is my listing not visible yet?",
        answer: "New and edited listings are reviewed by our moderation team before publication. A listing may be pending review, need more information, or have been rejected for a policy reason shown on the listing page. Check your account and the status label, then contact support if it stays pending.",
      },
      {
        question: "How do I make my listing sell faster?",
        answer: "Use daylight photos of every side, include the odometer and service records, state your price honestly, and describe modifications or damage. Our practical selling guide walks through the full process step by step.",
      },
      {
        question: "Can I edit or remove a sold listing?",
        answer: "Yes. Sign in, open your listings and edit the details or mark the item as sold. If you cannot access the account, email support with your listing URL and registered phone number.",
      },
      {
        question: "Are dealer listings treated differently?",
        answer: "Dealer accounts complete a separate business verification and can subscribe to plans for more active listings and promotion. See the dealer portal and pricing pages for the current workflow and published packages.",
      },
    ],
  },
  {
    title: "Accounts & verification",
    description: "Login, OTP and identity checks.",
    questions: [
      {
        question: "I did not receive the OTP. What should I do?",
        answer: "Check the number you entered, wait for the full 10-minute expiry, and request a new code. Codes are limited to a small number of attempts. If your SMS is blocked or you changed your phone number, contact support from your registered email address.",
      },
      {
        question: "What does identity verification mean?",
        answer: "Where we offer identity verification, your status is recorded as unverified, pending, verified or rejected after review. It is separate from phone OTP verification and dealer verification. We ask only for what is necessary and never request an OTP.",
      },
      {
        question: "I forgot my password — how do I recover my account?",
        answer: "Use the Forgot password link on the login page. A reset link is sent to your registered email address and is valid for 60 minutes. If you no longer have that email address, contact support for an identity check.",
      },
    ],
  },
  {
    title: "Payments & plans",
    description: "Promotions, subscriptions and billing.",
    questions: [
      {
        question: "What does it cost to list a vehicle?",
        answer: "Posting a basic listing is free. Optional ad packages and dealer plans are shown with their actual prices on the pricing page, read from our live catalogue. We do not publish guessed or sample prices.",
      },
      {
        question: "Does Garidekho hold my vehicle payment?",
        answer: "No. Garidekho does not act as escrow for private vehicle sales. Payment arrangements are made directly between buyer and seller; only platform services such as promotions are billed by us.",
      },
      {
        question: "How do I report a payment problem?",
        answer: "Email support with the transaction reference, date, amount and payment provider. Do not send card numbers, PINs or OTP codes. We will check the payment record and respond with the next steps.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHero
        eyebrow="Help center"
        title="How can we help?"
        description="Browse answers by topic. Open a question to see the full answer, or contact our team when you need a person."
        breadcrumb={[{ label: "Help", href: "/help" }]}
      />

      <div className="container-gdk space-y-8 py-10 lg:py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Read the selling guide", "/guides/sell-car-fast-safely-pakistan"],
            ["Check verification levels", "/verification"],
            ["Estimate your vehicle", "/estimate"],
            ["Calculate car financing", "/emi-calculator"],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="surface-card rounded-xl p-4 text-sm font-semibold text-link transition-all hover:-translate-y-0.5 hover:shadow-float dark:text-link-soft">
              {label} →
            </Link>
          ))}
        </div>

        <FaqAccordion categories={faqs} />

        <div className="surface-card flex flex-col gap-3 rounded-xl p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">Still need help?</h2>
            <p className="mt-1 text-sm text-ink-500">Email us with your account identifier and the listing URL if relevant.</p>
          </div>
          <a href={`mailto:${email}?subject=${encodeURIComponent("Help center question")}`} className="inline-flex h-10 shrink-0 items-center rounded-xl bg-cta px-4 text-sm font-semibold text-white hover:bg-cta-hover">
            Email support
          </a>
        </div>
      </div>
    </>
  );
}
