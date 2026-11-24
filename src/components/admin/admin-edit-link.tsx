"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type Capability = "canManageCms" | "canPromote";

/** Only renders for authorised admins; public pages stay statically cacheable. */
export function AdminEditLink({
  href,
  label = "Admin edit",
  capability = "canManageCms",
  className,
}: {
  href: string;
  label?: string;
  capability?: Capability;
  className?: string;
}) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/permissions")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { canManageCms?: boolean; canPromote?: boolean } | null) => {
        if (active && data?.[capability]) setAllowed(true);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [capability]);

  if (!allowed) return null;

  return (
    <Link
      href={href}
      data-admin-edit-link
      className={cn(
        "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-link/50 bg-signal-50 px-2.5 text-xs font-bold text-link-ink transition-colors hover:border-link hover:bg-link/10 dark:bg-link/10 dark:text-link-soft",
        className,
      )}
    >
      <Pencil className="size-3.5" />
      {label}
    </Link>
  );
}
