"use client";

import { useEffect } from "react";

export function ViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    const key = `gdk-view-${listingId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void fetch(`/api/listings/${listingId}/view`, { method: "POST" }).catch(() => undefined);
  }, [listingId]);
  return null;
}
