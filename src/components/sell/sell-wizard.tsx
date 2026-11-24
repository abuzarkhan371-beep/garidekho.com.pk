"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Camera, Check, CheckCircle2, ChevronLeft, ChevronRight,
  CircleAlert, GripVertical, ImagePlus, Loader2, MapPin, Save, ShieldCheck, Trash2, UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field, Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/providers/toast-provider";
import { MAX_LISTING_IMAGES, YEAR_OPTIONS } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";

export type WizardData = {
  categories: { id: string; name: string; slug: string }[];
  makes: {
    id: string;
    name: string;
    models: {
      id: string;
      name: string;
      variants: { id: string; name: string; engineCc: number | null; transmission: string | null; fuelType: string | null }[];
    }[];
  }[];
  cities: { id: string; name: string; areas: { id: string; name: string }[] }[];
  features: string[];
  options: {
    bodyTypes: { value: string; label: string }[];
    fuelTypes: { value: string; label: string }[];
    transmissions: { value: string; label: string }[];
    assemblyTypes: { value: string; label: string }[];
    conditions: { value: string; label: string }[];
  };
};

export type WizardImage = { id: string; url: string; position: number; publicId: string };

export type WizardState = {
  categoryId: string;
  makeId: string;
  modelId: string;
  variantId: string;
  year: number;
  mileageKm: number;
  engineCc: number;
  transmission: string;
  fuelType: string;
  bodyType: string;
  exteriorColor: string;
  assemblyType: string;
  condition: string;
  features: string[];
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  cityId: string;
  areaId: string;
  registrationCityId: string;
  sellerName: string;
  sellerPhone: string;
  whatsappNumber: string;
  showPhone: boolean;
  images: WizardImage[];
};

export type WizardSnapshot = WizardState & { id: string };

const STEPS = [
  { title: "Vehicle", subtitle: "Category & identity" },
  { title: "Details", subtitle: "Specifications" },
  { title: "Photos", subtitle: "Up to 20 images" },
  { title: "Description", subtitle: "Title & story" },
  { title: "Price", subtitle: "Ask & negotiation" },
  { title: "Location", subtitle: "City & area" },
  { title: "Seller", subtitle: "Contact details" },
  { title: "Review", subtitle: "Check & publish" },
];

const NONE = "__none__";

function toValue(value: string) {
  return value === NONE ? "" : value;
}

function emptyState(data: WizardData, defaults: { sellerName: string; sellerPhone: string; cityId: string }): WizardState {
  return {
    categoryId: data.categories[0]?.id ?? "",
    makeId: "", modelId: "", variantId: "",
    year: new Date().getFullYear(), mileageKm: 0, engineCc: 0,
    transmission: "", fuelType: "", bodyType: "", exteriorColor: "", assemblyType: "", condition: "",
    features: [], title: "", description: "", price: 0, negotiable: false,
    cityId: defaults.cityId, areaId: "", registrationCityId: "",
    sellerName: defaults.sellerName, sellerPhone: defaults.sellerPhone, whatsappNumber: "", showPhone: true,
    images: [],
  };
}

export function SellWizard({
  data, initialDraft, isGuest, defaultSellerName, defaultSellerPhone, defaultCityId,
}: {
  data: WizardData;
  initialDraft: WizardSnapshot | null;
  isGuest: boolean;
  defaultSellerName: string;
  defaultSellerPhone: string;
  defaultCityId: string;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(() => {
    if (!initialDraft) return emptyState(data, { sellerName: defaultSellerName, sellerPhone: defaultSellerPhone, cityId: defaultCityId });
    const { id: _id, ...rest } = initialDraft;
    return rest;
  });
  const [draftId, setDraftId] = useState<string | null>(initialDraft?.id ?? null);
  const draftIdRef = useRef<string | null>(initialDraft?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [published, setPublished] = useState<{ slug: string; status: string } | null>(null);
  const skipAutosave = useRef(true);

  const makes = data.makes;
  const selectedMake = useMemo(() => makes.find((make) => make.id === state.makeId), [makes, state.makeId]);
  const models = selectedMake?.models ?? [];
  const selectedModel = useMemo(() => models.find((model) => model.id === state.modelId), [models, state.modelId]);
  const variants = selectedModel?.variants ?? [];
  const selectedVariant = variants.find((variant) => variant.id === state.variantId);
  const cities = data.cities;
  const areas = cities.find((city) => city.id === state.cityId)?.areas ?? [];

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  const payload = useCallback((snapshot: WizardState, id: string) => ({ id, ...snapshot }), []);

  const patchDraft = useCallback(async (snapshot: WizardState, id: string) => {
    const response = await fetch("/api/listings/draft", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(snapshot, id)),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "Could not save your draft.");
    }
  }, [payload]);

  const ensureDraft = useCallback(async (snapshot: WizardState) => {
    if (draftIdRef.current) return draftIdRef.current;
    const response = await fetch("/api/listings/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: snapshot.categoryId,
        makeId: snapshot.makeId || undefined,
        modelId: snapshot.modelId || undefined,
        variantId: snapshot.variantId || undefined,
      }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "Could not start your draft.");
    }
    const body = (await response.json()) as { id: string };
    draftIdRef.current = body.id;
    setDraftId(body.id);
    return body.id;
  }, []);

  // Debounced autosave once a draft exists.
  useEffect(() => {
    if (!draftId || published) return;
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    const timer = setTimeout(() => {
      patchDraft(state, draftId).catch(() => undefined);
    }, 1200);
    return () => clearTimeout(timer);
  }, [state, draftId, patchDraft, published]);

  function validateCurrentStep() {
    switch (step) {
      case 0: return Boolean(state.categoryId);
      case 1: return state.year >= 1950 && state.mileageKm >= 0;
      case 2: return state.images.length > 0;
      case 3: return state.title.trim().length >= 10 && state.description.trim().length >= 30;
      case 4: return state.price >= 1000;
      case 5: return Boolean(state.cityId);
      case 6: return state.sellerName.trim().length >= 2 && /^\+92\d{10}$/.test(state.sellerPhone.trim());
      default: return true;
    }
  }

  const validationHints = [
    "Choose a category to continue.",
    "Enter a valid model year and mileage.",
    "Upload at least one photo of your vehicle.",
    "Write a title of at least 10 characters and a description of at least 30 characters.",
    "Enter an asking price of at least PKR 1,000.",
    "Select the city where the vehicle is located.",
    "Enter the seller name and a valid Pakistani mobile number (+92xxxxxxxxxx).",
    "",
  ];

  async function goNext() {
    if (!validateCurrentStep()) {
      toast(validationHints[step], "error");
      return;
    }
    setSaving(true);
    try {
      const id = await ensureDraft(state);
      await patchDraft(state, id);
      setStep((current) => Math.min(STEPS.length - 1, current + 1));
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not continue", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveNow() {
    setSaving(true);
    try {
      const id = await ensureDraft(state);
      await patchDraft(state, id);
      toast("Draft saved. You can come back any time from this device.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not save draft", "error");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setSaving(true);
    try {
      const id = await ensureDraft(state);
      await patchDraft(state, id);
      const response = await fetch(`/api/listings/${id}/publish`, { method: "POST" });
      const body = (await response.json().catch(() => ({}))) as { error?: string; slug?: string; status?: string };
      if (!response.ok || !body.slug) {
        toast(body.error ?? "Could not submit your ad.", "error");
        return;
      }
      setPublished({ slug: body.slug, status: body.status ?? "PENDING" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not submit your ad.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    if (state.images.length + list.length > MAX_LISTING_IMAGES) {
      toast(`You can upload a maximum of ${MAX_LISTING_IMAGES} photos.`, "error");
      return;
    }
    setUploading(true);
    try {
      const id = await ensureDraft(state);
      const formData = new FormData();
      for (const file of list) formData.append("files", file);
      const response = await fetch(`/api/listings/${id}/images`, { method: "POST", body: formData });
      const body = (await response.json().catch(() => ({}))) as { error?: string; images?: WizardImage[] };
      if (!response.ok || !body.images) throw new Error(body.error ?? "Upload failed");
      setState((current) => ({
        ...current,
        images: [...current.images, ...body.images!].map((image, index) => ({ ...image, position: index })),
      }));
      toast(`${body.images.length} photo${body.images.length === 1 ? "" : "s"} uploaded and compressed.`, "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  async function persistOrder(images: WizardImage[]) {
    if (!draftIdRef.current) return;
    const response = await fetch(`/api/listings/${draftIdRef.current}/images`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: images.map((image) => image.id) }),
    });
    if (!response.ok) toast("Could not save the new photo order.", "error");
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= state.images.length) return;
    const next = [...state.images];
    [next[index], next[target]] = [next[target], next[index]];
    const reindexed = next.map((image, position) => ({ ...image, position }));
    update("images", reindexed);
    void persistOrder(reindexed);
  }

  async function removeImage(image: WizardImage) {
    if (!draftIdRef.current) return;
    const response = await fetch(
      `/api/listings/${draftIdRef.current}/images?publicId=${encodeURIComponent(image.publicId)}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      toast("Could not remove this photo.", "error");
      return;
    }
    const remaining = state.images.filter((item) => item.id !== image.id).map((item, position) => ({ ...item, position }));
    update("images", remaining);
  }

  if (published) {
    return (
      <div className="container-gdk flex min-h-[70vh] items-center justify-center py-16">
        <div className="surface-card max-w-xl rounded-3xl p-8 text-center sm:p-12">
          <CheckCircle2 className="mx-auto size-14 text-link" />
          <h1 className="mt-5 font-display text-3xl font-extrabold">Your ad was submitted</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">
            Our moderation team will review the listing shortly. We will notify you as soon as it is live on Garidekho.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild><Link href={`/listings/${published.slug}`}>View your ad</Link></Button>
            <Button asChild variant="outline"><Link href="/my-ads">Track my ads</Link></Button>
          </div>
          {isGuest && (
            <p className="mt-6 rounded-xl bg-signal-50 p-4 text-xs leading-relaxed text-link-ink dark:bg-link/10 dark:text-link-soft">
              Want a dashboard for your ads and messages?{" "}
              <Link href="/register?claim=1" className="font-bold underline">Create a free account</Link> with the same phone number — your ads will move with you.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container-gdk py-8 lg:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">Sell on Garidekho</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Post your ad</h1>
            <p className="mt-2 text-sm text-ink-500">Eight simple steps. Your progress is saved automatically.</p>
          </div>
          <Button variant="outline" size="sm" onClick={saveNow} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} Save draft
          </Button>
        </div>

        <div className="mt-7 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {STEPS.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => { if (index < step) setStep(index); }}
              disabled={index > step}
              className={cn(
                "rounded-xl border px-1 py-2 text-center transition-colors",
                index === step
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                  : index < step
                    ? "border-link bg-signal-50 text-link-ink dark:border-link/50 dark:bg-link/10 dark:text-link-soft"
                    : "border-ink-100 bg-white text-ink-400 dark:border-ink-800 dark:bg-ink-900",
              )}
              title={item.subtitle}
            >
              <span className={cn("mx-auto flex size-6 items-center justify-center rounded-full text-[0.7rem] font-bold", index <= step ? "bg-orange-500 text-white" : "bg-ink-100 text-ink-400 dark:bg-ink-800")}>
                {index < step ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span className="mt-1 block truncate text-[0.65rem] font-semibold">{item.title}</span>
            </button>
          ))}
        </div>

        <div className="surface-card mt-5 rounded-xl p-5 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4 border-b border-ink-100 pb-5 dark:border-ink-800">
            <div>
              <p className="text-xs font-semibold text-link">Step {step + 1} of {STEPS.length}</p>
              <h2 className="mt-1 font-display text-xl font-extrabold">{STEPS[step].title}</h2>
              <p className="mt-1 text-sm text-ink-500">{STEPS[step].subtitle}</p>
            </div>
            {isGuest && (
              <span className="flex items-center gap-1.5 rounded-full bg-signal-50 px-3 py-1.5 text-xs font-semibold text-link-ink dark:bg-link/10 dark:text-link-soft">
                <ShieldCheck className="size-3.5" /> Guest seller
              </span>
            )}
          </div>

          {step === 0 && (
            <div className="space-y-5">
              <SelectField
                label="Vehicle category"
                value={state.categoryId}
                onChange={(value) => setState((current) => ({ ...current, categoryId: value, makeId: "", modelId: "", variantId: "" }))}
                placeholder="Choose a category"
                options={data.categories.map((category) => ({ value: category.id, label: category.name }))}
                required
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <SelectField
                  label="Make / brand"
                  value={state.makeId}
                  onChange={(value) => setState((current) => ({ ...current, makeId: toValue(value), modelId: "", variantId: "" }))}
                  placeholder="Select make"
                  options={makes.map((make) => ({ value: make.id, label: make.name }))}
                />
                <SelectField
                  label="Model"
                  value={state.modelId}
                  onChange={(value) => setState((current) => ({ ...current, modelId: toValue(value), variantId: "" }))}
                  placeholder={state.makeId ? "Select model" : "Select make first"}
                  disabled={!state.makeId}
                  options={models.map((model) => ({ value: model.id, label: model.name }))}
                  allowNone
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <SelectField
                  label="Variant / trim"
                  value={state.variantId}
                  onChange={(value) => setState((current) => ({ ...current, variantId: toValue(value) }))}
                  placeholder={state.modelId ? "Select variant" : "Select model first"}
                  disabled={!state.modelId}
                  options={variants.map((variant) => ({ value: variant.id, label: variant.name }))}
                  allowNone
                />
                <SelectField
                  label="Overall condition"
                  value={state.condition}
                  onChange={(value) => update("condition", toValue(value))}
                  placeholder="Select condition"
                  options={data.options.conditions}
                />
              </div>
              {(selectedVariant?.engineCc || selectedVariant?.transmission || selectedVariant?.fuelType) && (
                <div className="rounded-xl border border-signal-200 bg-signal-50 p-4 text-sm text-link-ink dark:border-link/40 dark:bg-link/10 dark:text-link-soft">
                  <p className="font-bold">Selected variant details</p>
                  <p className="mt-1 text-xs">
                    {[selectedVariant.engineCc ? `${selectedVariant.engineCc} cc` : null, selectedVariant.transmission?.replaceAll("_", " "), selectedVariant.fuelType?.replaceAll("_", " ")]
                      .filter(Boolean).join(" · ")}
                  </p>
                </div>
              )}
              <p className="text-xs text-ink-500">
                Can&apos;t find your exact model? Leave make and model blank — you can still describe it in the title and description.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-3">
                <NumberField label="Model year" value={state.year} min={1950} max={new Date().getFullYear() + 1} onChange={(value) => update("year", value)} />
                <NumberField label="Mileage (km)" value={state.mileageKm} min={0} max={2_000_000} onChange={(value) => update("mileageKm", value)} />
                <NumberField label="Engine (cc)" value={state.engineCc} min={0} max={10000} onChange={(value) => update("engineCc", value)} optional />
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <SelectField
                  label="Transmission"
                  value={state.transmission}
                  onChange={(value) => update("transmission", toValue(value))}
                  placeholder="Select"
                  options={data.options.transmissions}
                  allowNone
                />
                <SelectField
                  label="Fuel type"
                  value={state.fuelType}
                  onChange={(value) => update("fuelType", toValue(value))}
                  placeholder="Select"
                  options={data.options.fuelTypes}
                  allowNone
                />
                <SelectField
                  label="Body type"
                  value={state.bodyType}
                  onChange={(value) => update("bodyType", toValue(value))}
                  placeholder="Select"
                  options={data.options.bodyTypes}
                  allowNone
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField label="Exterior colour" value={state.exteriorColor} onChange={(value) => update("exteriorColor", value)} placeholder="e.g. Pearl White" optional />
                <SelectField
                  label="Assembly"
                  value={state.assemblyType}
                  onChange={(value) => update("assemblyType", toValue(value))}
                  placeholder="Select"
                  options={data.options.assemblyTypes}
                  allowNone
                />
              </div>
              <div>
                <Label className="text-xs text-ink-500">Features & extras</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.features.map((feature) => {
                    const active = state.features.includes(feature);
                    return (
                      <button
                        key={feature}
                        type="button"
                        onClick={() => update("features", active ? state.features.filter((item) => item !== feature) : [...state.features, feature])}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                          active
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-ink-200 text-ink-600 hover:border-link dark:border-ink-700 dark:text-ink-300",
                        )}
                      >
                        {feature}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/60 px-4 py-10 text-center dark:border-ink-700 dark:bg-ink-800/30">
                <UploadCloud className="size-10 text-link" />
                <h3 className="mt-3 font-bold">Add photos of your vehicle</h3>
                <p className="mt-1.5 max-w-md text-xs leading-relaxed text-ink-500">
                  JPG, PNG, WEBP or AVIF up to 8 MB each. Photos are automatically resized and compressed. The first photo is your cover image.
                </p>
                <label className={cn("mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600", uploading && "pointer-events-none opacity-60")}>
                  {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
                  {uploading ? "Processing photos…" : "Choose photos"}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(event) => { void uploadFiles(event.target.files); event.target.value = ""; }} />
                </label>
                <p className="mt-3 text-xs text-ink-400">{state.images.length} / {MAX_LISTING_IMAGES} photos added</p>
              </div>

              {state.images.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {state.images.map((image, index) => (
                    <div key={image.id} className="group relative overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700" draggable onDragStart={() => undefined}>
                      <div className="relative aspect-[4/3] bg-ink-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.url} alt={`Vehicle photo ${index + 1}`} className="size-full object-cover" />
                        {index === 0 && (
                          <span className="absolute left-2 top-2 rounded-md bg-orange-500 px-2 py-0.5 text-[0.65rem] font-bold text-white">Cover</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1 p-1.5">
                        <span className="flex items-center gap-1 text-[0.65rem] font-semibold text-ink-400"><GripVertical className="size-3" /> {index + 1}</span>
                        <div className="flex gap-1">
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label="Move photo left"><ChevronLeft /></Button>
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveImage(index, 1)} disabled={index === state.images.length - 1} aria-label="Move photo right"><ChevronRight /></Button>
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => void removeImage(image)} aria-label="Remove photo" className="text-red-500"><Trash2 /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <TextField
                label="Ad title"
                value={state.title}
                onChange={(value) => update("title", value)}
                placeholder="e.g. Toyota Corolla 2021 XLi — single owner, full service history"
                maxLength={140}
                required
                hint={`${state.title.length}/140 characters. Include make, model, year and trim.`}
              />
              <div className="space-y-1.5">
                <Field label="Description" required hint="Mention condition, service history, documents, modifications and reason for selling.">
                  <Textarea
                    value={state.description}
                    onChange={(event) => update("description", event.target.value)}
                    maxLength={8000}
                    rows={9}
                    placeholder="Tell buyers what makes this vehicle a good choice…"
                  />
                </Field>
                <p className={cn("text-xs", state.description.length >= 30 ? "text-link" : "text-ink-400")}>{state.description.length}/8000 characters · minimum 30</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
                <Field label="Asking price (PKR)" required hint="Enter a realistic price in Pakistani Rupees.">
                  <Input
                    type="number"
                    min={1000}
                    step={1000}
                    value={state.price || ""}
                    onChange={(event) => update("price", Number(event.target.value))}
                    placeholder="e.g. 4500000"
                  />
                </Field>
                <div className="rounded-xl bg-ink-950 px-5 py-3 text-white">
                  <p className="text-xs text-ink-300">Preview</p>
                  <p className="font-display text-xl font-extrabold">{formatPrice(state.price || 0)}</p>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
                <Checkbox checked={state.negotiable} onCheckedChange={(checked) => update("negotiable", checked === true)} />
                <span>
                  <span className="block text-sm font-semibold">Price is negotiable</span>
                  <span className="block text-xs text-ink-500">Buyers will see a “Negotiable” badge on your ad.</span>
                </span>
              </label>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <SelectField
                  label="Current city"
                  value={state.cityId}
                  onChange={(value) => setState((current) => ({ ...current, cityId: toValue(value), areaId: "" }))}
                  placeholder="Select city"
                  options={cities.map((city) => ({ value: city.id, label: city.name }))}
                  required
                />
                <SelectField
                  label="Area / locality"
                  value={state.areaId}
                  onChange={(value) => update("areaId", toValue(value))}
                  placeholder={state.cityId ? "Select area" : "Select city first"}
                  disabled={!state.cityId}
                  options={areas.map((area) => ({ value: area.id, label: area.name }))}
                  allowNone
                />
              </div>
              <SelectField
                label="Registration city"
                value={state.registrationCityId}
                onChange={(value) => update("registrationCityId", toValue(value))}
                placeholder="Select registration city"
                options={cities.map((city) => ({ value: city.id, label: city.name }))}
                allowNone
              />
              <div className="flex items-start gap-2 rounded-xl bg-ink-50 p-4 text-xs text-ink-500 dark:bg-ink-800/50">
                <MapPin className="mt-0.5 size-4 shrink-0 text-link" />
                Your exact address is never shown. Buyers only see the city and area you choose here.
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              {isGuest && (
                <div className="flex items-start gap-2 rounded-xl border border-signal-200 bg-signal-50 p-4 text-sm text-link-ink dark:border-link/40 dark:bg-link/10 dark:text-link-soft">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="font-bold">Your phone is verified</p>
                    <p className="mt-1 text-xs">We will use this number for buyer inquiries. You can edit the display name below.</p>
                  </div>
                </div>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField label="Seller name" value={state.sellerName} onChange={(value) => update("sellerName", value)} placeholder="Your name or business name" required />
                <TextField label="Mobile number" value={state.sellerPhone} onChange={(value) => update("sellerPhone", value)} placeholder="+923001234567" required />
              </div>
              <TextField label="WhatsApp number (optional)" value={state.whatsappNumber} onChange={(value) => update("whatsappNumber", value)} placeholder="+923001234567" optional />
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
                <Checkbox checked={state.showPhone} onCheckedChange={(checked) => update("showPhone", checked === true)} />
                <span>
                  <span className="block text-sm font-semibold">Show my phone number on the ad</span>
                  <span className="block text-xs text-ink-500">If turned off, buyers can still contact you through the inquiry form.</span>
                </span>
              </label>
              {!isGuest && !state.sellerPhone && (
                <p className="text-xs text-ink-500">
                  Add a phone number above, or <Link href="/verify-phone?purpose=PHONE_VERIFY" className="font-semibold text-link underline">verify your account number</Link>.
                </p>
              )}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewItem label="Category" value={data.categories.find((category) => category.id === state.categoryId)?.name ?? "—"} />
                <ReviewItem label="Vehicle" value={[makes.find((make) => make.id === state.makeId)?.name, models.find((model) => model.id === state.modelId)?.name, variants.find((variant) => variant.id === state.variantId)?.name].filter(Boolean).join(" ") || state.title || "—"} />
                <ReviewItem label="Year & mileage" value={`${state.year} · ${state.mileageKm.toLocaleString("en-PK")} km`} />
                <ReviewItem label="Asking price" value={formatPrice(state.price)} />
                <ReviewItem label="Location" value={cities.find((city) => city.id === state.cityId)?.name ?? "—"} />
                <ReviewItem label="Photos" value={`${state.images.length} uploaded`} />
                <ReviewItem label="Seller" value={state.sellerName} />
                <ReviewItem label="Phone" value={state.sellerPhone || "—"} />
              </div>
              <div className="rounded-xl bg-ink-950 p-5 text-white">
                <h3 className="font-display text-lg font-bold">{state.title || "Untitled listing"}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-ink-300">{state.description || "Add a description in step 4."}</p>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-signal-200 bg-signal-50 p-4 text-xs leading-relaxed text-link-ink dark:border-link/40 dark:bg-link/10 dark:text-link-soft">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                By publishing, you confirm that the vehicle details are accurate and that you have the right to advertise it. Our moderators may request documents or reject misleading ads.
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-ink-100 pt-5 dark:border-ink-800">
            <Button variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || saving}>
              <ArrowLeft /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={goNext} disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                Save & continue <ArrowRight />
              </Button>
            ) : (
              <Button onClick={publish} disabled={saving} size="lg">
                {saving ? <Loader2 className="animate-spin" /> : <Camera />}
                Submit ad for review
              </Button>
            )}
          </div>

          {(saving || uploading) && (
            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-ink-400">
              <Loader2 className="size-3 animate-spin" /> Working on it…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SelectField({
  label, value, onChange, options, placeholder, disabled, required, allowNone,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  allowNone?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-ink-500">{label}{required && <span className="ml-0.5 text-red-500">*</span>}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger aria-label={label}><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {allowNone && <SelectItem value={NONE}>Not applicable</SelectItem>}
          {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function TextField({
  label, value, onChange, placeholder, required, optional, maxLength, hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  maxLength?: number;
  hint?: string;
}) {
  return (
    <Field label={label} required={required} hint={hint ?? (optional ? "Optional" : undefined)}>
      <Input value={value} maxLength={maxLength} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function NumberField({
  label, value, min, max, onChange, optional,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  optional?: boolean;
}) {
  return (
    <Field label={label} hint={optional ? "Optional — enter 0 if unknown" : undefined}>
      <Input
        type="number"
        min={min}
        max={max}
        value={value || ""}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 p-3.5 dark:border-ink-800">
      <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 truncate text-sm font-bold">{value}</p>
    </div>
  );
}
