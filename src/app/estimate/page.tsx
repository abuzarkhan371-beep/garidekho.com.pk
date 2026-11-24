import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { EstimateCalculator, type EstimateComparable, type EstimateTaxonomy } from "@/components/content/estimate-calculator";
import { PageHero, ContentSection } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "Vehicle Value Estimator — price from real listings",
  description: "Estimate a fair market price for your car in Pakistan using active Garidekho listings for the same make, model, year and mileage. See the methodology and every comparable used.",
  alternates: { canonical: "/estimate" },
};

export default async function EstimatePage() {
  const [listings, makes] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      include: { city: true, vehicle: { include: { make: true, model: true, variant: true } } },
      orderBy: { publishedAt: "desc" },
      take: 300,
    }),
    prisma.vehicleMake.findMany({
      where: { isActive: true },
      include: {
        models: {
          where: { isActive: true },
          include: { variants: { where: { isActive: true }, orderBy: { name: "asc" } } },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const comparables: EstimateComparable[] = listings.flatMap((listing) => {
    const { make, model, variant } = listing.vehicle;
    if (!make || !model) return [];
    return [{
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      price: listing.price,
      year: listing.vehicle.year,
      mileageKm: listing.vehicle.mileageKm,
      makeSlug: make.slug,
      makeName: make.name,
      modelSlug: model.slug,
      modelName: model.name,
      variantName: variant?.name ?? null,
      city: listing.city?.name ?? null,
    }];
  });

  const taxonomy: EstimateTaxonomy[] = makes.map((make) => ({
    name: make.name,
    slug: make.slug,
    models: make.models.map((model) => ({
      name: model.name,
      slug: model.slug,
      variants: model.variants.map((variant) => variant.name),
    })),
  }));

  const defaultYear = new Date().getFullYear();

  return (
    <>
      <PageHero
        eyebrow="Research tools"
        title="What is your vehicle worth?"
        description="Choose a make, model, year and mileage to see a market estimate calculated from active listings in our database. Every adjustment and comparable is shown — no hidden price database."
        breadcrumb={[{ label: "Vehicle estimator", href: "/estimate" }]}
      />

      <div className="container-gdk space-y-10 py-10 lg:py-14">
        <EstimateCalculator comparables={comparables} taxonomy={taxonomy} defaultYear={defaultYear} />

        <ContentSection title="Important limitations">
          <p>
            This tool uses asking prices, not completed sale prices. The result is a guide to the current market, not a
            valuation certificate. Condition, colour, options, registration city, flood history and negotiation all affect
            the final price. If fewer than two comparable active listings exist, no estimate is shown.
          </p>
          <p>
            For a model in high demand but rarely listed, try a nearby year or check the <Link href="/search" className="font-semibold text-link hover:underline dark:text-link-soft">live search results</Link>
            directly. Before buying or selling, an <Link href="/inspection" className="font-semibold text-link hover:underline dark:text-link-soft">independent inspection</Link> is
            the best way to understand condition.
          </p>
        </ContentSection>
      </div>
    </>
  );
}
