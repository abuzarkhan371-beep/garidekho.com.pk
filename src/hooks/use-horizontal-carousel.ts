"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Shared behaviour for the homepage card sliders. */
export function useHorizontalCarousel<T extends HTMLElement = HTMLDivElement>(resetKey?: unknown) {
  const ref = useRef<T | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateArrows = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    el.addEventListener("scroll", updateArrows, { passive: true });
    updateArrows();
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", updateArrows);
    };
  }, [updateArrows]);

  const previousResetKey = useRef(resetKey);
  useEffect(() => {
    // Only reset when the tab/mode actually changes. Resetting on mount can
    // cancel a click that happens immediately after hydration.
    if (previousResetKey.current === resetKey) return;
    previousResetKey.current = resetKey;
    ref.current?.scrollTo({ left: 0, behavior: "auto" });
    updateArrows();
  }, [resetKey, updateArrows]);

  const slide = useCallback((direction: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-carousel-card]");
    const styles = window.getComputedStyle(el);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    const step = card ? card.offsetWidth + gap : el.clientWidth * 0.66;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  }, []);

  return { ref, canPrev, canNext, slide };
}
