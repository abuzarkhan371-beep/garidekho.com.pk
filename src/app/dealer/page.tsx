import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, CarFront, ExternalLink, Store } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dealer portal",
  robots: { index: false, follow: false },
};

export default async function DealerPortalPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dealer");

  if (user.roleName !== "DEALER") {
    return (
      <div className="container-gdk py-8 lg:py-12">
        <div className="surface-card mx-auto max-w-2xl rounded-xl px-6 py-20 text-center">
          <Store className="mx-auto size-12 text-ink-300" />
          <h1 className="mt-4 font-display text-2xl font-extrabold">Dealer access</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            The dealer portal is available to accounts with a dealer role. Explore our plans if you are interested in listing inventory as a business.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild><Link href="/pricing">View dealer plans</Link></Button>
            <Button asChild variant="outline"><Link href="/contact">Talk to sales</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  const dealer = await prisma.dealer.findUnique({
    where: { userId: user.id },
    include: {
      city: { select: { name: true } },
      listings: { where: { deletedAt: null }, select: { id: true, status: true } },
    },
  });

  if (!dealer) {
    return (
      <div className="container-gdk py-8 lg:py-12">
        <div className="surface-card mx-auto max-w-2xl rounded-xl px-6 py-20 text-center">
          <Store className="mx-auto size-12 text-ink-300" />
          <h1 className="mt-4 font-display text-2xl font-extrabold">Set up your dealer profile</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            Your account has dealer access, but no business profile has been created yet. Contact our support team to complete verification and add your business details.
          </p>
          <Button asChild className="mt-6"><Link href="/contact">Contact support</Link></Button>
        </div>
      </div>
    );
  }

  const activeCount = dealer.listings.filter((listing) => listing.status === "ACTIVE").length;

  return (
    <div className="container-gdk py-8 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">Business account</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Dealer portal</h1>
      <p className="mt-2 text-sm text-ink-500">Manage how buyers see your dealership on Garidekho.</p>

      <div className="surface-card mt-8 rounded-xl p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-extrabold">{dealer.businessName}</h2>
              <Badge variant={dealer.verificationStatus === "VERIFIED" ? "success" : "neutral"}>
                {dealer.verificationStatus === "VERIFIED" && <BadgeCheck className="size-3.5" />}
                {dealer.verificationStatus.toLowerCase()}
              </Badge>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-500">
              <CarFront className="size-4 text-link" />
              {activeCount} active {activeCount === 1 ? "ad" : "ads"} · {dealer.listings.length} total
            </p>
            {dealer.city && <p className="mt-1 text-sm text-ink-500">Based in {dealer.city.name}</p>}
          </div>
          <Button asChild>
            <Link href={`/dealers/${dealer.slug}`}><ExternalLink /> View public profile</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-3 border-t border-ink-100 pt-6 text-sm sm:grid-cols-2">
          <p><span className="text-ink-500">Phone:</span> <span className="font-semibold">{dealer.phone}</span></p>
          {dealer.email && <p><span className="text-ink-500">Email:</span> <span className="font-semibold">{dealer.email}</span></p>}
          {dealer.address && <p><span className="text-ink-500">Address:</span> <span className="font-semibold">{dealer.address}</span></p>}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="outline"><Link href="/my-ads">Manage listings</Link></Button>
          <Button asChild variant="ghost"><Link href="/dashboard/settings">Account settings</Link></Button>
        </div>
      </div>
    </div>
  );
}
