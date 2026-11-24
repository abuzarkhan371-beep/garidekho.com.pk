"use client";

import { useState } from "react";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryImage = { id: string; url: string; alt: string | null };

export function ListingGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-ink-100 text-ink-400 dark:bg-ink-800">
        <Camera className="size-10" />
      </div>
    );
  }

  const current = images[active];
  const go = (direction: -1 | 1) => setActive((index) => (index + direction + images.length) % images.length);

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl bg-ink-950">
        <div className="relative aspect-[4/3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.url} alt={current.alt ?? `${title} photo ${active + 1}`} className="size-full object-cover" />
        </div>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
              aria-label="Previous photo"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
              aria-label="Next photo"
            >
              <ChevronRight />
            </button>
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-semibold text-white"
            >
              <Camera className="size-3.5" /> {active + 1} / {images.length}
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative size-20 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                index === active ? "border-link" : "border-transparent opacity-70 hover:opacity-100",
              )}
              aria-label={`View photo ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(false)}>
          <button type="button" className="absolute right-5 top-5 text-white" onClick={() => setLightbox(false)} aria-label="Close full screen photo">
            <X className="size-7" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.url} alt={current.alt ?? title} className="max-h-full max-w-full object-contain" onClick={(event) => event.stopPropagation()} />
          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); go(1); }}
              className="absolute right-5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              aria-label="Next photo"
            >
              <ChevronRight />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
