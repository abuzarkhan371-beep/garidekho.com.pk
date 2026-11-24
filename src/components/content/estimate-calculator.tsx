"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clamp, formatNumber } from "@/lib/utils";

export type EstimateComparable = {
  id: string;
  slug: string;
  title: string;
  price: number;
  year: number;
  mileageKm: number;
  makeSlug: string;
  makeName: string;
  modelSlug: string;
  modelName: string;
  variantName: string | null;
  city: string | null;
};

export type EstimateTaxonomy = {
  name: string;
  slug: string;
  models: { name: string; slug: string; variants: string[] }[];
};

type AdjustedComparable = EstimateComparable & { adjusted: number; yearFactor: number; mileageFactor: number };

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

const selectClass =
  "flex h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-sm text-ink-900 shadow-sm transition-colors hover:border-ink-300 focus-visible:border-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50";

/** Calculates a transparent estimate from real active listings passed by the server. */
export function EstimateCalculator({
  comparables,
  taxonomy,
  defaultYear,
}: {
  comparables: EstimateComparable[];
  taxonomy: EstimateTaxonomy[];
  defaultYear: number;
}) {
  const [makeSlug, setMakeSlug] = useState(taxonomy[0]?.slug ?? "");
  const [modelSlug, setModelSlug] = useState(taxonomy[0]?.models[0]?.slug ?? "");
  const [variantName, setVariantName] = useState("");
  const [year, setYear] = useState(String(defaultYear));
  const [mileage, setMileage] = useState("30000");

  const models = taxonomy.find((make) => make.slug === makeSlug)?.models ?? [];
  const variants = models.find((model) => model.slug === modelSlug)?.variants ?? [];

  const result = useMemo(() => {
    const targetYear = Number(year) || defaultYear;
    const targetMileage = Math.max(0, Number(mileage) || 0);

    const scoped = comparables.filter(
      (item) => item.makeSlug === makeSlug && item.modelSlug === modelSlug,
    );
    const exact = variantName ? scoped.filter((item) => item.variantName === variantName) : scoped;
    const usedFallback = exact.length < 3 && scoped.length > 0;
    const pool = usedFallback ? scoped : exact;

    const adjusted: AdjustedComparable[] = pool.map((item) => {
      const rawYearFactor = 1 + (targetYear - item.year) * 0.035;
      const yearFactor = clamp(rawYearFactor, 0.75, 1.3);
      const rawMileageFactor = 1 + ((item.mileageKm - targetMileage) / 10_000) * 0.01;
      const mileageFactor = clamp(rawMileageFactor, 0.8, 1.2);
      return { ...item, yearFactor, mileageFactor, adjusted: item.price * yearFactor * mileageFactor };
    });

    const center = median(adjusted.map((item) => item.adjusted));
    const retained = center > 0
      ? adjusted.filter((item) => Math.abs(item.adjusted - center) / center <= 0.45)
      : adjusted;
    const estimate = median(retained.map((item) => item.adjusted));
    const values = retained.map((item) => item.adjusted);

    return {
      scopedCount: scoped.length,
      usedFallback,
      selectedVariantCount: exact.length,
      retained,
      sampleSize: retained.length,
      estimate: estimate > 0 ? roundTo(estimate, 10_000) : 0,
      low: values.length > 0 ? roundTo(Math.min(...values), 10_000) : 0,
      high: values.length > 0 ? roundTo(Math.max(...values), 10_000) : 0,
    };
  }, [comparables, makeSlug, modelSlug, variantName, year, mileage, defaultYear]);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="surface-card h-fit rounded-xl p-5 sm:p-6">
        <h2 className="font-display text-base font-bold">Your vehicle</h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="estimate-make">Make</Label>
            <select
              id="estimate-make"
              className={selectClass}
              value={makeSlug}
              onChange={(event) => {
                const nextMake = event.target.value;
                const nextModels = taxonomy.find((make) => make.slug === nextMake)?.models ?? [];
                setMakeSlug(nextMake);
                setModelSlug(nextModels[0]?.slug ?? "");
                setVariantName("");
              }}
            >
              {taxonomy.map((make) => <option key={make.slug} value={make.slug}>{make.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estimate-model">Model</Label>
            <select
              id="estimate-model"
              className={selectClass}
              value={modelSlug}
              onChange={(event) => { setModelSlug(event.target.value); setVariantName(""); }}
            >
              {models.map((model) => <option key={model.slug} value={model.slug}>{model.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estimate-variant">Variant (optional)</Label>
            <select
              id="estimate-variant"
              className={selectClass}
              value={variantName}
              onChange={(event) => setVariantName(event.target.value)}
            >
              <option value="">Any variant</option>
              {variants.map((variant) => <option key={variant} value={variant}>{variant}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="estimate-year">Model year</Label>
              <Input id="estimate-year" type="number" min="1990" max={defaultYear + 2} value={year} onChange={(event) => setYear(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estimate-mileage">Mileage (km)</Label>
              <Input id="estimate-mileage" type="number" min="0" value={mileage} onChange={(event) => setMileage(event.target.value)} />
            </div>
          </div>
        </div>
        <p className="mt-5 flex gap-2 rounded-xl bg-signal-50 p-3 text-xs leading-relaxed text-link-ink dark:bg-link/10 dark:text-link-soft">
          <Info className="mt-0.5 size-4 shrink-0" />
          Values update instantly using the active listings currently in our database. No price is shown until enough
          comparable listings exist.
        </p>
      </div>

      <div className="space-y-5">
        <div className="surface-card overflow-hidden rounded-xl">
          <div className="bg-ink-950 p-6 text-white dark:bg-link-ink">
            <p className="text-xs font-semibold uppercase tracking-widest text-link-soft">Transparent market estimate</p>
            {result.estimate > 0 ? (
              <>
                <p className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">PKR {formatNumber(result.estimate)}</p>
                <p className="mt-2 text-xs text-ink-200">
                  Comparable range: PKR {formatNumber(result.low)} – PKR {formatNumber(result.high)} · {result.sampleSize} listings used
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 font-display text-2xl font-extrabold">Not enough data yet</p>
                <p className="mt-2 text-xs text-ink-200">
                  We need at least two active listings for this make and model to publish an estimate.
                </p>
              </>
            )}
          </div>
          <div className="grid grid-cols-3 gap-px bg-ink-100 dark:bg-ink-800">
            {[
              ["Matching listings", String(result.scopedCount)],
              ["Outliers excluded", String(Math.max(0, result.retained.length - result.sampleSize))],
              ["Variant matches", String(result.selectedVariantCount)],
            ].map(([label, value]) => (
              <div key={label} className="bg-white p-4 dark:bg-ink-900">
                <p className="text-[0.68rem] font-medium uppercase tracking-wide text-ink-400">{label}</p>
                <p className="mt-1 text-base font-bold text-ink-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {result.usedFallback && result.scopedCount > 0 && (
          <p className="rounded-xl border border-signal-200 bg-signal-50 p-3 text-xs text-signal-700 dark:border-signal-800 dark:bg-signal-900/20 dark:text-signal-200">
            Fewer than three exact-variant listings were available, so the estimate uses all active listings for this model.
          </p>
        )}

        <div className="surface-card rounded-xl p-5 sm:p-6">
          <h2 className="font-display text-base font-bold">How this estimate is calculated</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs leading-relaxed text-ink-600 dark:text-ink-300">
            <li>Filter active, moderated listings to the selected make and model.</li>
            <li>Normalise each price to your model year: 3.5% per year difference, capped at ±25%.</li>
            <li>Normalise mileage: 1% for every 10,000 km difference, capped at ±20%.</li>
            <li>Discard adjusted prices more than 45% away from the median to limit outliers.</li>
            <li>Report the median of the remaining listings, rounded to the nearest PKR 10,000.</li>
          </ol>
        </div>

        {result.retained.length > 0 && (
          <div className="surface-card rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold">Listings behind the estimate</h2>
              <Badge variant="neutral">Live data</Badge>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="text-ink-400">
                  <tr className="border-b border-ink-100 dark:border-ink-800">
                    <th className="py-2 font-semibold">Listing</th>
                    <th className="py-2 text-right font-semibold">Year / km</th>
                    <th className="py-2 text-right font-semibold">Asking</th>
                    <th className="py-2 text-right font-semibold">Adjusted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {result.retained.map((item) => (
                    <tr key={item.id} className="text-ink-700 dark:text-ink-200">
                      <td className="py-2">
                        <Link href={`/listings/${item.slug}`} className="inline-flex items-center gap-1 font-semibold hover:text-link dark:hover:text-link-soft">
                          <span className="max-w-[190px] truncate">{item.title}</span><ArrowUpRight className="size-3 shrink-0" />
                        </Link>
                        <span className="block text-[0.68rem] text-ink-400">{item.city ?? "Pakistan"}{item.variantName ? ` · ${item.variantName}` : ""}</span>
                      </td>
                      <td className="py-2 text-right">{item.year} / {formatNumber(item.mileageKm)}</td>
                      <td className="py-2 text-right">PKR {formatNumber(item.price)}</td>
                      <td className="py-2 text-right font-semibold">PKR {formatNumber(Math.round(item.adjusted))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
