import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryLanding } from "@/components/content/category-data";
import { CategoryLanding } from "@/components/content/category-landing";

export const metadata: Metadata = {
  title: "Auto Parts for Sale in Pakistan",
  description: "Find genuine and aftermarket spare parts from sellers across Pakistan. Browse the active auto parts catalogue on Garidekho.",
  alternates: { canonical: "/auto-parts" },
};

export default async function AutoPartsPage() {
  const data = await getCategoryLanding("auto-parts");
  if (!data) notFound();
  return <CategoryLanding data={data} />;
}
