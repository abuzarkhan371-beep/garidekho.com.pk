import type { Metadata } from "next";
import Link from "next/link";
import { EmiCalculator } from "@/components/content/emi-calculator";
import { PageHero, ContentSection } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "Car EMI Calculator — Pakistan auto loan repayment",
  description: "Calculate a vehicle loan installment in Pakistan with down payment, tenure and interest rate. See total interest, total payable and a year-by-year amortization summary.",
  alternates: { canonical: "/emi-calculator" },
};

export default function EmiCalculatorPage() {
  return (
    <>
      <PageHero
        eyebrow="Research tools"
        title="Car EMI calculator"
        description="Work out a monthly installment before you visit the bank. Enter the vehicle price, your down payment, loan tenure and the interest rate you have been quoted."
        breadcrumb={[{ label: "EMI calculator", href: "/emi-calculator" }]}
      />

      <div className="container-gdk space-y-10 py-10 lg:py-14">
        <EmiCalculator />

        <ContentSection title="How the calculation works">
          <p>
            We use the standard reducing-balance annuity formula: the financed amount is the vehicle price minus your
            down payment, the annual rate is divided by twelve, and interest is charged each month on the remaining
            balance. The table shows how much principal and interest you pay in each year and the balance carried forward.
          </p>
          <p>
            The result excludes bank processing fees, insurance, withholding tax, registration charges and any balloon
            payment. Your bank&apos;s final schedule is authoritative. Use the <Link href="/estimate" className="font-semibold text-link hover:underline dark:text-link-soft">vehicle estimator</Link> to
            sanity-check the price you plan to finance.
          </p>
        </ContentSection>
      </div>
    </>
  );
}
