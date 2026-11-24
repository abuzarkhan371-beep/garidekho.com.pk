"use client";

import Link from "next/link";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { YEAR_OPTIONS } from "@/lib/constants";
import type { ParsedSearch } from "@/lib/search";

type FilterData = {
  makes: { name: string; slug: string }[];
  cities: { name: string; slug: string }[];
  categories: { name: string; slug: string }[];
  options: {
    bodyTypes: { value: string; label: string }[];
    fuelTypes: { value: string; label: string }[];
    transmissions: { value: string; label: string }[];
  };
};

export function FilterPanel({
  params, data, action,
}: { params: ParsedSearch; data: FilterData; action: string }) {
  return (
    <form method="get" action={action} className="space-y-5">
      <input type="hidden" name="q" value={params.q} />
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold"><SlidersHorizontal className="size-4 text-link" /> Filters</h2>
        <Button asChild variant="ghost" size="sm"><Link href="/search"><RotateCcw /> Clear</Link></Button>
      </div>

      <FilterBlock label="Category">
        <Select name="category" defaultValue={params.category || undefined}>
          <SelectTrigger aria-label="Filter by category"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            {data.categories.map((item) => <SelectItem key={item.slug} value={item.slug}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterBlock>

      <FilterBlock label="Brand">
        <Select name="make" defaultValue={params.make || undefined}>
          <SelectTrigger aria-label="Filter by brand"><SelectValue placeholder="All brands" /></SelectTrigger>
          <SelectContent>
            {data.makes.map((item) => <SelectItem key={item.slug} value={item.slug}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterBlock>

      <FilterBlock label="City">
        <Select name="city" defaultValue={params.city || undefined}>
          <SelectTrigger aria-label="Filter by city"><SelectValue placeholder="All Pakistan" /></SelectTrigger>
          <SelectContent>
            {data.cities.map((item) => <SelectItem key={item.slug} value={item.slug}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterBlock>

      <div className="grid grid-cols-2 gap-3">
        <FilterBlock label="Min price (PKR)"><Input name="minPrice" type="number" min={0} defaultValue={params.minPrice || undefined} placeholder="0" /></FilterBlock>
        <FilterBlock label="Max price (PKR)"><Input name="maxPrice" type="number" min={0} defaultValue={params.maxPrice || undefined} placeholder="Any" /></FilterBlock>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FilterBlock label="Year from">
          <Select name="yearFrom" defaultValue={params.yearFrom || undefined}>
            <SelectTrigger aria-label="Filter by earliest year"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>{YEAR_OPTIONS.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent>
          </Select>
        </FilterBlock>
        <FilterBlock label="Year to">
          <Select name="yearTo" defaultValue={params.yearTo || undefined}>
            <SelectTrigger aria-label="Filter by latest year"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>{YEAR_OPTIONS.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent>
          </Select>
        </FilterBlock>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FilterBlock label="Min mileage (km)"><Input name="minMileage" type="number" min={0} defaultValue={params.minMileage || undefined} placeholder="0" /></FilterBlock>
        <FilterBlock label="Max mileage (km)"><Input name="maxMileage" type="number" min={0} defaultValue={params.maxMileage || undefined} placeholder="Any" /></FilterBlock>
      </div>

      <FilterBlock label="Engine (cc)"><Input name="engineCc" type="number" min={0} defaultValue={params.engineCc || undefined} placeholder="e.g. 1800" /></FilterBlock>
      <FilterBlock label="Transmission">
        <Select name="transmission" defaultValue={params.transmission || undefined}>
          <SelectTrigger aria-label="Filter by transmission"><SelectValue placeholder="Any transmission" /></SelectTrigger>
          <SelectContent>
            {data.options.transmissions.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterBlock>
      <FilterBlock label="Fuel type">
        <Select name="fuelType" defaultValue={params.fuelType || undefined}>
          <SelectTrigger aria-label="Filter by fuel type"><SelectValue placeholder="Any fuel type" /></SelectTrigger>
          <SelectContent>
            {data.options.fuelTypes.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterBlock>
      <FilterBlock label="Body type">
        <Select name="bodyType" defaultValue={params.bodyType || undefined}>
          <SelectTrigger aria-label="Filter by body type"><SelectValue placeholder="Any body type" /></SelectTrigger>
          <SelectContent>
            {data.options.bodyTypes.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterBlock>
      <FilterBlock label="Colour"><Input name="color" defaultValue={params.color || undefined} placeholder="e.g. White" /></FilterBlock>
      <FilterBlock label="Seller type">
        <Select name="sellerType" defaultValue={params.sellerType || undefined}>
          <SelectTrigger aria-label="Filter by seller type"><SelectValue placeholder="Any seller" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="OWNER">Private owner</SelectItem>
            <SelectItem value="DEALER">Dealer</SelectItem>
          </SelectContent>
        </Select>
      </FilterBlock>

      <div className="space-y-3 rounded-xl bg-ink-50 p-3 dark:bg-ink-800/50">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
          <Checkbox name="verified" value="true" defaultChecked={params.verified === "true"} /> Verified listings only
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
          <Checkbox name="featured" value="true" defaultChecked={params.featured === "true"} /> Featured only
        </label>
      </div>

      <Button type="submit" className="w-full">Apply filters</Button>
    </form>
  );
}

function FilterBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-ink-500">{label}</Label>
      {children}
    </div>
  );
}
