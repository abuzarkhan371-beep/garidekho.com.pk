import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { ROLE_LABELS } from "@/lib/constants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");

  const canAccess =
    hasPermission(user, "admin.access") ||
    hasPermission(user, "listing.moderate") ||
    hasPermission(user, "report.manage") ||
    hasPermission(user, "cms.manage") ||
    hasPermission(user, "listing.promote");
  if (!canAccess) redirect("/");

  const name = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ") || user.email;

  return (
    <div className="container-gdk py-8 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="surface-card rounded-xl p-4">
            <div className="flex items-center gap-3 border-b border-ink-100 pb-4 dark:border-ink-800">
              <div className="flex size-10 items-center justify-center rounded-xl bg-cta text-white">
                <ShieldCheck className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{name}</p>
                <p className="text-xs text-ink-500">{ROLE_LABELS[user.roleName] ?? user.roleName}</p>
              </div>
            </div>
            <div className="pt-4">
              <AdminNav
                canManageSettings={hasPermission(user, "settings.manage")}
                canManageCatalog={hasPermission(user, "category.manage")}
                canManageTaxonomy={hasPermission(user, "taxonomy.manage")}
                canManageLocations={hasPermission(user, "location.manage")}
                canManageCms={hasPermission(user, "cms.manage")}
                canPromote={hasPermission(user, "listing.promote")}
              />
            </div>
          </div>
          <Link href="/" className="mt-4 block px-3 text-xs font-semibold text-ink-500 hover:text-link">
            ← Back to marketplace
          </Link>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
