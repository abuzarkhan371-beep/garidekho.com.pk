"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { updateListingDetailsAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/providers/toast-provider";

type Choice = { value: string; label: string };

export type EditableListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  status: "DRAFT" | "PENDING" | "ACTIVE" | "REJECTED" | "EXPIRED" | "SOLD";
  negotiable: boolean;
  cityId: string | null;
  areaId: string | null;
  sellerName: string;
  sellerPhone: string;
  vehicle: {
    year: number;
    mileageKm: number;
    transmission: string | null;
    fuelType: string | null;
    bodyType: string | null;
    assemblyType: string | null;
    condition: string | null;
  };
};

const STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending review" },
  { value: "ACTIVE", label: "Active / live" },
  { value: "REJECTED", label: "Rejected" },
  { value: "EXPIRED", label: "Expired" },
  { value: "SOLD", label: "Sold" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

const selectClass =
  "h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm font-medium text-ink-800 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100";

export function ListingEditForm({
  listing,
  cities,
  options,
}: {
  listing: EditableListing;
  cities: { id: string; name: string; areas: { id: string; name: string }[] }[];
  options: {
    bodyTypes: Choice[];
    fuelTypes: Choice[];
    transmissions: Choice[];
    assemblyTypes: Choice[];
    conditions: Choice[];
  };
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [cityId, setCityId] = useState(listing.cityId ?? "");
  const areas = cities.find((city) => city.id === cityId)?.areas ?? [];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("listingId", listing.id);
    startTransition(async () => {
      const result = await updateListingDetailsAction(formData);
      toast(result.message, result.ok ? "success" : "error");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="surface-card rounded-xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">Listing details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <Input name="title" defaultValue={listing.title} minLength={10} maxLength={140} required />
          </Field>
          <Field label="Price (PKR)">
            <Input name="price" type="number" defaultValue={listing.price} min={1000} max={1_000_000_000} required />
          </Field>
          <Field label="Status">
            <select name="status" defaultValue={listing.status} className={selectClass}>
              {STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </Field>
          <label className="flex items-end gap-2 pb-2.5 text-sm font-semibold">
            <input name="negotiable" type="checkbox" defaultChecked={listing.negotiable} className="size-4 accent-link" />
            Price is negotiable
          </label>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Textarea name="description" defaultValue={listing.description} rows={7} minLength={30} maxLength={8000} required />
            </Field>
          </div>
        </div>
      </div>

      <div className="surface-card rounded-xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">Vehicle specifications</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Model year">
            <Input name="year" type="number" defaultValue={listing.vehicle.year} min={1950} max={new Date().getFullYear() + 1} required />
          </Field>
          <Field label="Mileage (km)">
            <Input name="mileageKm" type="number" defaultValue={listing.vehicle.mileageKm} min={0} max={2_000_000} required />
          </Field>
          <Field label="Transmission">
            <select name="transmission" defaultValue={listing.vehicle.transmission ?? ""} className={selectClass} required>
              <option value="">Select…</option>
              {options.transmissions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Fuel type">
            <select name="fuelType" defaultValue={listing.vehicle.fuelType ?? ""} className={selectClass} required>
              <option value="">Select…</option>
              {options.fuelTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Body type">
            <select name="bodyType" defaultValue={listing.vehicle.bodyType ?? ""} className={selectClass} required>
              <option value="">Select…</option>
              {options.bodyTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Assembly">
            <select name="assemblyType" defaultValue={listing.vehicle.assemblyType ?? ""} className={selectClass}>
              <option value="">Not specified</option>
              {options.assemblyTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Condition">
            <select name="condition" defaultValue={listing.vehicle.condition ?? ""} className={selectClass}>
              <option value="">Not specified</option>
              {options.conditions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
        </div>
      </div>

      <div className="surface-card rounded-xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">Location & seller</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="City">
            <select name="cityId" value={cityId} onChange={(event) => setCityId(event.target.value)} className={selectClass} required>
              <option value="">Select city…</option>
              {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
          </Field>
          <Field label="Area">
            <select name="areaId" defaultValue={listing.areaId ?? ""} className={selectClass}>
              <option value="">Not specified</option>
              {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
            </select>
          </Field>
          <Field label="Seller name">
            <Input name="sellerName" defaultValue={listing.sellerName} minLength={2} maxLength={80} required />
          </Field>
          <Field label="Seller phone">
            <Input name="sellerPhone" defaultValue={listing.sellerPhone} placeholder="+92xxxxxxxxxx" required />
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Save changes
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/listings"><ArrowLeft /> Back to listings</Link>
        </Button>
      </div>
    </form>
  );
}
