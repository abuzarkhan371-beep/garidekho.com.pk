"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes, CarFront, FileWarning, LayoutDashboard, ListChecks, MapPin,
  Newspaper, Palette, Star, Tags, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminNav({
  canManageSettings = false,
  canManageCatalog = false,
  canManageTaxonomy = false,
  canManageLocations = false,
  canManageCms = false,
  canPromote = false,
}: {
  canManageSettings?: boolean;
  canManageCatalog?: boolean;
  canManageTaxonomy?: boolean;
  canManageLocations?: boolean;
  canManageCms?: boolean;
  canPromote?: boolean;
}) {
  const pathname = usePathname();
  const links = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/listings", label: "Listings", icon: ListChecks },
    { href: "/admin/reports", label: "Reports", icon: FileWarning },
    { href: "/admin/users", label: "Users", icon: Users },
    ...(canManageCms ? [{ href: "/admin/cars", label: "Cars & specs", icon: CarFront }] : []),
    ...(canPromote ? [{ href: "/admin/featured", label: "Featured ads", icon: Star }] : []),
    ...(canManageCms ? [{ href: "/admin/news", label: "News", icon: Newspaper }] : []),
    ...(canManageCatalog ? [{ href: "/admin/categories", label: "Categories", icon: Boxes }] : []),
    ...(canManageTaxonomy
      ? [
          { href: "/admin/brands", label: "Brands & models", icon: Tags },
          { href: "/admin/taxonomy", label: "Ad form options", icon: ListChecks },
        ]
      : []),
    ...(canManageLocations ? [{ href: "/admin/locations", label: "Locations", icon: MapPin }] : []),
    ...(canManageSettings ? [{ href: "/admin/customizer", label: "Site settings", icon: Palette }] : []),
  ];

  return (
    <nav className="space-y-1" aria-label="Admin navigation">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-link-ink text-white shadow-sm"
                : "text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
