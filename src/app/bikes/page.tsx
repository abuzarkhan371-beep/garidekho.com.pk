import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryLanding } from "@/components/content/category-data";
import { CategoryLanding } from "@/components/content/category-landing";

export const metadata: Metadata = {
  title: "Bikes & Motorcycles for Sale in Pakistan",
  description: "Find motorcycles and scooters from verified owners and dealers across Pakistan. Browse active listings by brand and city.",
  alternates: { canonical: "/bikes" },
};

export default async function BikesPage() {
  const data = await getCategoryLanding("bikes");
  if (!data) notFound();
  return <CategoryLanding data={data} />;
}
