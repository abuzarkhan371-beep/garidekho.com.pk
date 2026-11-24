import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { PageHero, ContentSection } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "Pricing — ad packages and dealer plans",
  description: "See current Garidekho advertising package and dealer subscription prices, read directly from our live catalogue. Basic listings are free.",
  alternates: { canonical: "/pricing" },
};

const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@garidekho.com.pk";
const intervalLabels: Record<string, string> = { MONTHLY: "month", QUARTERLY: "quarter", YEARLY: "year" };

function formatPkr(value: number) {
  return `PKR ${new Intl.NumberFormat("en-PK").format(value)}`;
}

export default async function PricingPage() {
  let packages: { id: string; name: string; description: string | null; price: number; durationDays: number; features: string[] }[] = [];
  let plans: { id: string; name: string; description: string | null; price: number; interval: string; listingLimit: number; features: string[] }[] = [];

  try {
    [packages, plans] = await Promise.all([
      prisma.adPackage.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
        select: { id: true, name: true, description: true, price: true, durationDays: true, features: true },
      }),
      prisma.dealerPlan.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
        select: { id: true, name: true, description: true, price: true, interval: true, listingLimit: true, features: true },
      }),
    ]);
  } catch (error) {
    console.error("Could not load pricing catalogue", error);
  }

  const hasPrices = packages.length > 0 || plans.length > 0;

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Simple, published pricing"
        description="Posting a basic listing is free. Optional promotion packages and dealer subscriptions are loaded from our live catalogue — the prices below are the real stored values, not examples."
        breadcrumb={[{ label: "Pricing", href: "/pricing" }]}
      />

      <div className="container-gdk space-y-12 py-10 lg:py-14">
        {hasPrices ? (
          <>
            {packages.length > 0 && (
              <section>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-bold">Promote a single listing</h2>
                    <p className="mt-1 text-sm text-ink-500">One-off packages for private sellers and dealers.</p>
                  </div>
                  <Badge variant="success">{packages.length} active packages</Badge>
                </div>
                <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {packages.map((pkg) => (
                    <article key={pkg.id} className="surface-card flex flex-col rounded-xl p-6">
                      <h3 className="font-display text-lg font-bold text-ink-950 dark:text-white">{pkg.name}</h3>
                      <p className="mt-1 text-xs text-ink-500">{pkg.description ?? `Promotion for ${pkg.durationDays} days.`}</p>
                      <p className="mt-4 font-display text-2xl font-extrabold text-link dark:text-link-soft">{formatPkr(pkg.price)}</p>
                      <p className="text-xs text-ink-500">per {pkg.durationDays}-day campaign</p>
                      <ul className="mt-5 flex-1 space-y-2">
                        {pkg.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                            <Check className="mt-0.5 size-4 shrink-0 text-link" />{feature}
                          </li>
                        ))}
                      </ul>
                      <Link href="/sell" className="mt-6 inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800 dark:bg-link dark:text-ink-950">
                        Use this package <ArrowRight className="size-4" />
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {plans.length > 0 && (
              <section>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-bold">Dealer subscriptions</h2>
                    <p className="mt-1 text-sm text-ink-500">For businesses with a verified dealer storefront.</p>
                  </div>
                  <Badge variant="default">{plans.length} active plans</Badge>
                </div>
                <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {plans.map((plan) => (
                    <article key={plan.id} className="surface-card flex flex-col rounded-xl p-6">
                      <h3 className="font-display text-lg font-bold text-ink-950 dark:text-white">{plan.name}</h3>
                      <p className="mt-1 text-xs text-ink-500">{plan.description ?? `${plan.listingLimit} active listings included.`}</p>
                      <p className="mt-4 font-display text-2xl font-extrabold text-link dark:text-link-soft">{formatPkr(plan.price)}</p>
                      <p className="text-xs text-ink-500">per {intervalLabels[plan.interval] ?? plan.interval.toLowerCase()} · {plan.listingLimit} active listings</p>
                      <ul className="mt-5 flex-1 space-y-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                            <Check className="mt-0.5 size-4 shrink-0 text-link" />{feature}
                          </li>
                        ))}
                      </ul>
                      <Link href="/dealer" className="mt-6 inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-ink-200 px-4 text-sm font-semibold hover:border-link hover:text-link dark:border-ink-700">
                        Go to dealer portal <ArrowRight className="size-4" />
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="surface-card mx-auto max-w-2xl rounded-xl p-8 text-center">
            <h2 className="font-display text-xl font-bold">Contact sales for current pricing</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              No active packages or dealer plans are published in our catalogue right now. We do not display placeholder
              prices. Email <a href={`mailto:${email}?subject=${encodeURIComponent("Current pricing enquiry")}`} className="font-semibold text-link hover:underline dark:text-link-soft">{email}</a> with
              your requirements and our team will confirm the current options.
            </p>
          </div>
        )}

        <ContentSection title="How billing works">
          <p>
            Promotion and subscription fees cover Garidekho platform services only. Vehicle purchase prices are agreed
            directly between buyer and seller and are never collected by Garidekho. Payments for platform services are
            recorded against your account, and support can help if a transaction needs review.
          </p>
          <p>
            See the <Link href="/terms-of-use" className="font-semibold text-link hover:underline dark:text-link-soft">Terms of Use</Link> for
            refunds and enforcement rules, or the <Link href="/help" className="font-semibold text-link hover:underline dark:text-link-soft">Help Center</Link> for billing questions.
          </p>
        </ContentSection>
      </div>
    </>
  );
}
