import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryLanding } from "@/components/content/category-data";
import { CategoryLanding } from "@/components/content/category-landing";

export const metadata: Metadata = {
  title: "Commercial Vehicles for Sale in Pakistan",
  description: "Browse pickups, vans, trucks and buses listed by verified sellers across Pakistan for business and transport needs.",
  alternates: { canonical: "/commercial-vehicles" },
};

export default async function CommercialVehiclesPage() {
  const data = await getCategoryLanding("commercial-vehicles");
  if (!data) notFound();
  return <CategoryLanding data={data} />;
}
