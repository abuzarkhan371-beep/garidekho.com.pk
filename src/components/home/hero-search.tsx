"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRICE_PRESETS, YEAR_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type CityOption = { name: string; slug: string };
type Suggestion = { label: string; value: string; type: string };

const tabs = [
  { label: "Cars", value: "cars" },
  { label: "Bikes", value: "bikes" },
  { label: "Commercial", value: "commercial-vehicles" },
];

export function HeroSearch({
  cities,
  placeholder = "Try 'Corolla 2021', 'BYD electric', 'Alto'…",
  buttonLabel = "Search all listings",
}: {
  cities: CityOption[];
  placeholder?: string;
  buttonLabel?: string;
}) {
  const router = useRouter();
  const [category, setCategory] = useState("cars");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [year, setYear] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`);
        if (!response.ok) return;
        const data = (await response.json()) as { suggestions: Suggestion[] };
        if (!cancelled) setSuggestions(data.suggestions);
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    }, 180);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setFocused(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function submit(event?: React.FormEvent, override?: string) {
    event?.preventDefault();
    const params = new URLSearchParams();
    const term = (override ?? query).trim();
    if (term) params.set("q", term);
    if (city) params.set("city", city);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (year) params.set("yearFrom", year);
    if (category !== "cars") params.set("category", category);
    if (term) {
      try {
        const history = JSON.parse(localStorage.getItem("gdk-search-history") ?? "[]") as string[];
        localStorage.setItem("gdk-search-history", JSON.stringify([term, ...history.filter((item) => item !== term)].slice(0, 8)));
      } catch { /* storage unavailable */ }
    }
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="surface-card rounded-xl p-4 shadow-float sm:p-5">
      <div className="mb-4 flex items-center gap-1 border-b border-ink-100 pb-3 dark:border-ink-800">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setCategory(tab.value)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-sm font-bold transition-colors",
              category === tab.value
                ? "bg-navy text-white dark:bg-cta-ink dark:text-white"
                : "text-ink-500 hover:bg-ink-50 dark:hover:bg-ink-800",
            )}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto hidden items-center gap-1.5 text-xs font-medium text-ink-400 sm:flex">
          <SlidersHorizontal className="size-3.5" /> More filters on the search page
        </span>
      </div>

      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2.2fr_1fr_1fr_auto] lg:items-end">
        <div className="relative sm:col-span-2 lg:col-span-1" ref={containerRef}>
          <label htmlFor="hero-search-input" className="mb-1.5 block text-xs font-semibold text-ink-500">
            Search everything — brands, models, years, keywords
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <input
              id="hero-search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={(event) => { if (event.key === "Escape") setFocused(false); }}
              placeholder={placeholder}
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-ink-100 bg-white pl-10 pr-10 text-sm text-ink-900 shadow-sm outline-none transition-colors placeholder:text-ink-400 focus:border-link focus:ring-2 focus:ring-link/20 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
            />
            {loadingSuggestions && <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-link" />}
          </div>

          {focused && suggestions.length > 0 && (
            <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-ink-100 bg-white p-1.5 shadow-float dark:border-ink-700 dark:bg-ink-900">
              <p className="flex items-center gap-1.5 px-2.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-wide text-ink-400">
                <Sparkles className="size-3" /> Suggestions
              </p>
              {suggestions.map((item) => (
                <button
                  key={`${item.type}-${item.value}`}
                  type="button"
                  onClick={() => { setQuery(item.label); setFocused(false); submit(undefined, item.label); }}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-orange-50 dark:hover:bg-ink-800"
                >
                  <span className="truncate font-medium">{item.label}</span>
                  <span className="shrink-0 text-[0.65rem] uppercase text-ink-400">{item.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-500">City</label>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger aria-label="Select city"><SelectValue placeholder="All Pakistan" /></SelectTrigger>
            <SelectContent>
              {cities.map((item) => <SelectItem key={item.slug} value={item.slug}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-500">Budget</label>
          <Select value={maxPrice} onValueChange={setMaxPrice}>
            <SelectTrigger aria-label="Select budget"><SelectValue placeholder="Any price" /></SelectTrigger>
            <SelectContent>
              {PRICE_PRESETS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden space-y-1.5 lg:block">
          <label className="text-xs font-semibold text-ink-500">Year</label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28" aria-label="Select year"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((item) => <SelectItem key={item} value={String(item)}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" size="lg" className="h-11 w-full lg:w-auto lg:px-6 sm:col-span-2 lg:col-span-1">
          <Search /> {buttonLabel}
        </Button>
      </form>
    </div>
  );
}
