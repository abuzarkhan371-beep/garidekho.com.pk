"use client";

import { useEffect, useState, useActionState } from "react";
import Image from "next/image";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SpecFields } from "@/components/admin/spec-fields";
import {
  deleteNewCarAction,
  saveNewCarAction,
  saveUsedCarAction,
} from "@/app/admin/content/actions";
import { initialContentActionState, type ContentActionState } from "@/lib/admin-content";
import type { NewCarView } from "@/lib/data/new-car-catalog";
import { NEW_CAR_TABS } from "@/lib/data/new-car-catalog";
import { formatPrice } from "@/lib/utils";

const selectClass =
  "flex h-11 w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2 text-sm text-ink-900 shadow-sm focus-visible:border-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50";

export type UsedCarOption = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  isFeatured: boolean;
  isVerified: boolean;
  image: string;
  specs: import("@/lib/data/car-specs").CarSpecs | null;
  vehicle: {
    year: number;
    mileageKm: number;
    transmission: string | null;
    fuelType: string | null;
    bodyType: string | null;
    makeId: string | null;
    modelId: string | null;
  };
  cityId: string | null;
};

function ActionMessage({ ok, message }: { ok: boolean; message: string }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className={`rounded-xl px-4 py-3 text-sm font-semibold ${
        ok
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
      }`}
    >
      {message}
    </p>
  );
}

export function NewCarManager({ cars }: { cars: NewCarView[] }) {
  const [editing, setEditing] = useState<NewCarView | null>(null);
  const [state, action, pending] = useActionState(saveNewCarAction, initialContentActionState);
  const [deleteState, deleteAction] = useActionState(
    async (_prev: ContentActionState, formData: FormData) => deleteNewCarAction(formData),
    initialContentActionState,
  );

  useEffect(() => {
    if (state.ok) setEditing(null);
  }, [state.ok, state.message]);

  return (
    <div className="space-y-6">
      <div className="surface-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-extrabold">
              {editing ? `Edit ${editing.name}` : "Add a new car"}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Showroom cars appear in Featured New Cars and the new-car comparison section.
            </p>
          </div>
          {editing && (
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>
              <X className="size-4" /> Cancel edit
            </Button>
          )}
        </div>

        <form action={action} key={editing?.id ?? "new"} className="mt-5 space-y-5">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <ActionMessage {...state} />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Car name</span>
              <Input name="name" required defaultValue={editing?.name} placeholder="Toyota Corolla" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Manufacturer</span>
              <Input name="make" required defaultValue={editing?.make} placeholder="Toyota" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Model year</span>
              <Input name="year" type="number" required min={1950} max={2035} defaultValue={editing?.year ?? 2025} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Price (PKR)</span>
              <Input name="price" type="number" required min={100000} defaultValue={editing?.price} placeholder="5800000" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Showroom tab</span>
              <select name="tab" className={selectClass} defaultValue={editing?.tab ?? "popular"}>
                {NEW_CAR_TABS.map((tab) => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Display order</span>
              <Input name="sortOrder" type="number" min={0} defaultValue={editing?.sortOrder ?? 0} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Visible</span>
              <select name="isActive" className={selectClass} defaultValue={editing?.isActive === false ? "false" : "true"}>
                <option value="true">Active</option>
                <option value="false">Hidden</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Photo URL</span>
              <Input name="imageUrl" defaultValue={editing?.image} placeholder="https://…" />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold">Upload photo</span>
            <Input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="h-auto py-2" />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold">Short summary</span>
            <Textarea name="summary" maxLength={600} defaultValue={editing?.summary ?? ""} placeholder="Why this car stands out…" />
          </label>

          <div className="border-t border-ink-100 pt-5 dark:border-ink-800">
            <h3 className="mb-4 font-display text-base font-bold">Comparison specifications</h3>
            <SpecFields defaults={editing?.specs} />
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : editing ? "Save changes" : "Add new car"}
          </Button>
        </form>
      </div>

      <div className="surface-card overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-5 py-4 dark:border-ink-800">
          <h2 className="font-display text-lg font-bold">Catalogue ({cars.length})</h2>
          <ActionMessage {...deleteState} />
        </div>
        <div className="divide-y divide-ink-100 dark:divide-ink-800">
          {cars.map((car) => (
            <div key={car.id ?? car.slug} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                <Image src={car.image} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-bold">{car.name}</p>
                  <Badge variant={car.isActive === false ? "outline" : "signal"}>
                    {car.isActive === false ? "Hidden" : NEW_CAR_TABS.find((tab) => tab.id === car.tab)?.label}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  {formatPrice(car.price)} · {car.year} · {Object.keys(car.specs).length} specs
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(car)}>
                  <Pencil className="size-4" /> Edit
                </Button>
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={car.id ?? ""} />
                  <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="size-4" /> Delete
                  </Button>
                </form>
              </div>
            </div>
          ))}
          {cars.length === 0 && (
            <p className="px-5 py-12 text-center text-sm text-ink-500">No new cars yet. Add the first one above.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function UsedCarManager({
  listings,
  categories,
  makes,
  models,
  cities,
  initialEditId,
}: {
  listings: UsedCarOption[];
  categories: { id: string; name: string }[];
  makes: { id: string; name: string }[];
  models: { id: string; name: string; makeId: string | null }[];
  cities: { id: string; name: string }[];
  initialEditId?: string;
}) {
  const initial = listings.find((item) => item.id === initialEditId) ?? null;
  const [editing, setEditing] = useState<UsedCarOption | null>(initial);
  const [state, action, pending] = useActionState(saveUsedCarAction, initialContentActionState);

  useEffect(() => {
    if (state.ok) setEditing(null);
  }, [state.ok, state.message]);

  const visibleModels = editing?.vehicle.makeId
    ? models.filter((model) => model.makeId === editing.vehicle.makeId)
    : models;

  return (
    <div className="space-y-6">
      <div className="surface-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-extrabold">
              {editing ? `Edit ${editing.title}` : "Add a used car"}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Publishes immediately as an active ad with the full comparison spec sheet.
            </p>
          </div>
          {editing && (
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>
              <X className="size-4" /> Cancel edit
            </Button>
          )}
        </div>

        <form action={action} key={editing?.id ?? "new"} className="mt-5 space-y-5">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <ActionMessage {...state} />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="block sm:col-span-2 xl:col-span-2">
              <span className="mb-1 block text-xs font-semibold">Ad title</span>
              <Input name="title" required minLength={10} defaultValue={editing?.title} placeholder="Toyota Corolla 2021 full original" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Price (PKR)</span>
              <Input name="price" type="number" required min={100000} defaultValue={editing?.price} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Model year</span>
              <Input name="year" type="number" required min={1950} max={2035} defaultValue={editing?.vehicle.year ?? 2022} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Mileage (km)</span>
              <Input name="mileageKm" type="number" required min={0} defaultValue={editing?.vehicle.mileageKm ?? 0} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Category</span>
              <select name="categoryId" className={selectClass} required defaultValue="">
                <option value="" disabled>Select category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Brand</span>
              <select name="makeId" className={selectClass} defaultValue={editing?.vehicle.makeId ?? ""}>
                <option value="">Not set</option>
                {makes.map((make) => <option key={make.id} value={make.id}>{make.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Model</span>
              <select name="modelId" className={selectClass} defaultValue={editing?.vehicle.modelId ?? ""}>
                <option value="">Not set</option>
                {visibleModels.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">City</span>
              <select name="cityId" className={selectClass} defaultValue={editing?.cityId ?? ""}>
                <option value="">Not set</option>
                {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Featured ad</span>
              <select name="isFeatured" className={selectClass} defaultValue={editing?.isFeatured ? "true" : "false"}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Verified seller</span>
              <select name="isVerified" className={selectClass} defaultValue={editing?.isVerified ? "true" : "false"}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold">Description</span>
            <Textarea name="description" required minLength={30} maxLength={8000} defaultValue={editing?.description ?? ""} placeholder="Condition, service history, documents…" />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Photo URL</span>
              <Input name="imageUrl" defaultValue={editing?.image} placeholder="https://…" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Upload photo</span>
              <Input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="h-auto py-2" />
            </label>
          </div>

          <div className="border-t border-ink-100 pt-5 dark:border-ink-800">
            <h3 className="mb-4 font-display text-base font-bold">Comparison specifications</h3>
            <SpecFields defaults={editing?.specs ?? {
              transmission: editing?.vehicle.transmission,
              fuelType: editing?.vehicle.fuelType,
              bodyType: editing?.vehicle.bodyType,
            }} />
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : editing ? "Save changes" : "Publish used car"}
          </Button>
        </form>
      </div>

      <div className="surface-card overflow-hidden rounded-2xl">
        <div className="border-b border-ink-100 px-5 py-4 dark:border-ink-800">
          <h2 className="font-display text-lg font-bold">Published ads ({listings.length})</h2>
        </div>
        <div className="divide-y divide-ink-100 dark:divide-ink-800">
          {listings.slice(0, 40).map((listing) => (
            <div key={listing.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                {listing.image ? <Image src={listing.image} alt="" fill sizes="64px" className="object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{listing.title}</p>
                <p className="mt-1 text-xs text-ink-500">
                  {formatPrice(listing.price)} · {listing.vehicle.year} · {Object.keys(listing.specs ?? {}).length} specs
                  {listing.isFeatured ? " · Featured" : ""}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(listing)}>
                <Pencil className="size-4" /> Edit
              </Button>
            </div>
          ))}
          {listings.length === 0 && (
            <p className="px-5 py-12 text-center text-sm text-ink-500">No used car ads found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
