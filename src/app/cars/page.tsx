import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryLanding } from "@/components/content/category-data";
import { CategoryLanding } from "@/components/content/category-landing";

export const metadata: Metadata = {
  title: "Cars for Sale in Pakistan — verified listings",
  description: "Browse cars for sale in Pakistan by make, model, city and budget. Compare price in Pakistan across verified listings, all moderated before publication.",
  keywords: ["cars for sale in Pakistan", "used car for sale in Pakistan", "car price in Pakistan", "verified car listings Pakistan"],
  alternates: { canonical: "/cars" },
};

export default async function CarsPage() {
  const data = await getCategoryLanding("cars");
  if (!data) notFound();
  return <CategoryLanding data={data} />;
}
