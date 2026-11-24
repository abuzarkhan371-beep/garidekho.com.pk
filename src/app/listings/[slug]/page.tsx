import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  BadgeCheck, CalendarDays, CarFront, Check, Clock3, Fuel, Gauge, MapPin,
  MessagesSquare, Settings2, ShieldCheck, Tag, UserRound,
} from "lucide-react";
import { getSessionActor, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listingInclude, toListingCard } from "@/lib/data/listings";
import { SITE_URL } from "@/lib/constants";
import { getTaxonomyOptions, optionsToLabelMap } from "@/lib/taxonomy";
import { cn, formatNumber, formatPrice } from "@/lib/utils";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { ListingContact } from "@/components/listings/listing-contact";
import { ListingCard } from "@/components/listings/listing-card";
import { ViewTracker } from "@/components/listings/view-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ messageError?: string }> };

const detailInclude = {
  ...listingInclude,
  area: true,
  registrationCity: true,
  user: { select: { profile: { select: { firstName: true, lastName: true } } } },
} as const;

async function getListing(slug: string) {
  const actor = await getSessionActor();
  const listing = await prisma.listing.findFirst({
    where: {
      slug,
      deletedAt: null,
      ...(actor ? { OR: [{ status: "ACTIVE" }, { userId: actor.user.id }] } : { status: "ACTIVE" }),
    },
    include: detailInclude,
  });
  return { listing, actor };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const listing = await prisma.listing.findFirst({
    where: { slug, status: "ACTIVE", deletedAt: null },
    select: {
      title: true, description: true, price: true, publishedAt: true,
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
    },
  });
  if (!listing) return { title: "Listing not found" };

  const url = `/listings/${slug}`;
  const excerpt = listing.description.trim().slice(0, 160);
  const description = `Check ${listing.title} price in Pakistan, specs and seller details. ${excerpt}`.slice(0, 160);
  return {
    title: `${listing.title} — PKR ${listing.price.toLocaleString("en-PK")}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: listing.title,
      description,
      url,
      type: "website",
      images: listing.images[0]?.url ? [{ url: listing.images[0].url }] : [],
    },
  };
}

export default async function ListingDetailPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const { messageError } = await searchParams;
  const { listing, actor } = await getListing(slug);
  if (!listing) notFound();
  const listingId = listing.id;
  const sellerUserId = listing.userId;

  // Local server action: opens an existing conversation or starts a new one,
  // then saves the first message. Authorization is re-checked on the server.
  async function messageSeller(formData: FormData) {
    "use server";

    const buyer = await getSessionUser();
    if (!buyer) redirect(`/login?next=${encodeURIComponent(`/listings/${slug}`)}`);
    if (buyer.id === sellerUserId) {
      redirect(`/listings/${slug}?messageError=You+cannot+message+your+own+listing`);
    }

    const body = String(formData.get("body") ?? "").trim();
    if (body.length < 5 || body.length > 2000) {
      redirect(`/listings/${slug}?messageError=Enter+a+message+between+5+and+2000+characters`);
    }

    const seller = await prisma.user.findUnique({ where: { id: sellerUserId }, select: { id: true } });
    if (!seller) notFound();

    const conversation = await prisma.conversation.upsert({
      where: {
        listingId_buyerId_sellerId: { listingId, buyerId: buyer.id, sellerId: seller.id },
      },
      create: { listingId, buyerId: buyer.id, sellerId: seller.id },
      update: {},
    });

    await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: buyer.id,
          senderType: buyer.roleName === "DEALER" ? "DEALER" : "USER",
          body,
        },
      }),
      prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } }),
    ]);

    revalidatePath("/messages");
    revalidatePath(`/messages/${conversation.id}`);
    redirect(`/messages/${conversation.id}?started=1`);
  }

  const canMessage = Boolean(actor && !actor.isGuest && actor.user.id !== listing.userId);
  const isOwnListing = Boolean(actor && !actor.isGuest && actor.user.id === listing.userId);

  const related = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      id: { not: listing.id },
      OR: [
        { cityId: listing.cityId },
        { vehicle: { makeId: listing.vehicle.makeId, modelId: listing.vehicle.modelId } },
      ],
    },
    include: listingInclude,
    orderBy: { publishedAt: "desc" },
    take: 4,
  });

  const [isSaved, taxonomy] = await Promise.all([
    actor
      ? prisma.favourite.findUnique({
          where: { userId_listingId: { userId: actor.user.id, listingId: listing.id } },
          select: { id: true },
        }).then(Boolean)
      : Promise.resolve(false),
    getTaxonomyOptions(),
  ]);
  const optionLabels = optionsToLabelMap(taxonomy);

  const specs = [
    { icon: CalendarDays, label: "Model year", value: String(listing.vehicle.year) },
    { icon: Gauge, label: "Mileage", value: `${formatNumber(listing.vehicle.mileageKm)} km` },
    { icon: Settings2, label: "Transmission", value: listing.vehicle.transmission ? optionLabels[listing.vehicle.transmission] ?? listing.vehicle.transmission : "—" },
    { icon: Fuel, label: "Fuel type", value: listing.vehicle.fuelType ? optionLabels[listing.vehicle.fuelType] ?? listing.vehicle.fuelType : "—" },
    { icon: CarFront, label: "Body type", value: listing.vehicle.bodyType ? optionLabels[listing.vehicle.bodyType] ?? listing.vehicle.bodyType : "—" },
    { icon: Tag, label: "Condition", value: listing.vehicle.condition ? optionLabels[listing.vehicle.condition] ?? listing.vehicle.condition.replaceAll("_", " ") : "—" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: listing.title,
    description: listing.description,
    brand: listing.vehicle.make ? { "@type": "Brand", name: listing.vehicle.make.name } : undefined,
    model: listing.vehicle.model?.name,
    vehicleModelDate: String(listing.vehicle.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: listing.vehicle.mileageKm, unitCode: "KMT" },
    fuelType: listing.vehicle.fuelType,
    image: listing.images.map((image) => image.url),
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "PKR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/listings/${listing.slug}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ViewTracker listingId={listing.id} />
      <div className="container-gdk py-6 lg:py-9">
        <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-ink-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-link">Home</Link><span>/</span>
          <Link href="/search" className="hover:text-link">Vehicles</Link><span>/</span>
          {listing.vehicle.make && <><Link href={`/brand/${listing.vehicle.make.slug}`} className="hover:text-link">{listing.vehicle.make.name}</Link><span>/</span></>}
          <span className="font-semibold text-ink-800 dark:text-ink-200">{listing.title}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
          <div>
            <ListingGallery images={listing.images.map((image) => ({ id: image.id, url: image.url, alt: image.alt }))} title={listing.title} />

            <section className="surface-card mt-5 rounded-xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                {listing.isFeatured && <Badge variant="signal">Featured</Badge>}
                {listing.isVerified && <Badge variant="success"><BadgeCheck className="size-3" /> Verified</Badge>}
                <Badge variant="neutral">{listing.status}</Badge>
              </div>
              <h1 className="mt-3 font-display text-2xl font-extrabold leading-snug sm:text-3xl">{listing.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-500">
                <span className="flex items-center gap-1.5"><MapPin className="size-4 text-link" /> {[listing.area?.name, listing.city?.name].filter(Boolean).join(", ") || "Pakistan"}</span>
                <span className="flex items-center gap-1.5"><Clock3 className="size-4 text-link" /> Posted {listing.publishedAt ? new Date(listing.publishedAt).toLocaleDateString("en-PK") : "recently"}</span>
                <span>{formatNumber(listing.viewCount)} views</span>
              </div>
              <p className="mt-4 font-display text-3xl font-extrabold text-cta-ink dark:text-cta">{formatPrice(listing.price)}</p>
              {listing.negotiable && <p className="text-xs font-semibold text-ink-500">Price negotiable</p>}
            </section>

            <section className="surface-card mt-5 rounded-xl p-5 sm:p-6">
              <h2 className="font-display text-xl font-extrabold">Key details</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {specs.map((spec) => (
                  <div key={spec.label} className="rounded-xl bg-ink-50 p-3.5 dark:bg-ink-800/60">
                    <spec.icon className="size-4 text-link" />
                    <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-wide text-ink-400">{spec.label}</p>
                    <p className="mt-0.5 text-sm font-bold capitalize">{spec.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="surface-card mt-5 rounded-xl p-5 sm:p-6">
              <h2 className="font-display text-xl font-extrabold">About this vehicle</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink-600 dark:text-ink-300">{listing.description}</p>
            </section>

            {listing.vehicle.features.length > 0 && (
              <section className="surface-card mt-5 rounded-xl p-5 sm:p-6">
                <h2 className="font-display text-xl font-extrabold">Features & extras</h2>
                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {listing.vehicle.features.map((feature) => (
                    <p key={feature} className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                      <Check className="size-4 text-link" /> {feature}
                    </p>
                  ))}
                </div>
              </section>
            )}

            <section className="surface-card mt-5 rounded-xl p-5 sm:p-6">
              <h2 className="font-display text-xl font-extrabold">Vehicle information</h2>
              <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {[
                  ["Category", listing.vehicle.category.name],
                  ["Make", listing.vehicle.make?.name],
                  ["Model", listing.vehicle.model?.name],
                  ["Variant", listing.vehicle.variant?.name],
                  ["Exterior colour", listing.vehicle.exteriorColor],
                  ["Interior colour", listing.vehicle.interiorColor],
                  ["Assembly", listing.vehicle.assemblyType?.replaceAll("_", " ")],
                  ["Engine", listing.vehicle.engineCc ? `${listing.vehicle.engineCc} cc` : null],
                  ["Registration city", listing.registrationCity?.name],
                  ["Seller type", listing.sellerType],
                ].map(([label, value]) => value ? (
                  <div key={label} className="flex justify-between gap-4 border-b border-ink-100 py-2 text-sm dark:border-ink-800">
                    <dt className="text-ink-500">{label}</dt>
                    <dd className="text-right font-semibold capitalize">{value}</dd>
                  </div>
                ) : null)}
              </dl>
            </section>

            <section className="mt-5 rounded-xl border border-signal-200 bg-signal-50 p-5 text-sm text-link-ink dark:border-link/40 dark:bg-link/10 dark:text-link-soft">
              <h2 className="flex items-center gap-2 font-bold"><ShieldCheck className="size-5" /> Buy safely</h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed">
                <li>Inspect the vehicle and verify its documents before paying any advance.</li>
                <li>Meet in a public place and never share your OTP, password or banking PIN.</li>
                <li>Use the report button if something about this ad feels wrong.</li>
              </ul>
            </section>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <section className="surface-card rounded-xl p-5" aria-labelledby="message-seller-title">
              <h2 id="message-seller-title" className="flex items-center gap-2 font-display text-lg font-bold">
                <MessagesSquare className="size-5 text-link" /> Message seller
              </h2>
              {messageError && (
                <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {messageError}
                </p>
              )}
              {canMessage ? (
                <form action={messageSeller} className="mt-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="seller-message">Your message</Label>
                    <Textarea
                      id="seller-message"
                      name="body"
                      required
                      minLength={5}
                      maxLength={2000}
                      rows={3}
                      defaultValue={`Hi, is this ${listing.title} still available?`}
                    />
                  </div>
                  <Button type="submit" className="w-full"><MessagesSquare /> Send &amp; open inbox</Button>
                  <p className="text-center text-xs text-ink-500">Your conversation will be saved in your messages.</p>
                </form>
              ) : isOwnListing ? (
                <div className="mt-3">
                  <p className="text-sm text-ink-500">This is your listing. Replies from buyers appear in your inbox.</p>
                  <Button asChild variant="outline" className="mt-3 w-full"><Link href="/messages">Open messages</Link></Button>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-sm text-ink-500">Sign in to message the seller and keep the conversation in your inbox.</p>
                  <Button asChild variant="outline" className="mt-3 w-full">
                    <Link href={`/login?next=${encodeURIComponent(`/listings/${slug}`)}`}>Sign in to message</Link>
                  </Button>
                </div>
              )}
            </section>

            <ListingContact
              listingId={listing.id}
              slug={listing.slug}
              title={listing.title}
              price={listing.price}
              sellerName={listing.sellerName}
              sellerPhone={listing.sellerPhone}
              whatsappNumber={listing.whatsappNumber}
              showPhone={listing.showPhone}
              verified={listing.isVerified}
              isSaved={isSaved}
              dealer={listing.dealer ? { businessName: listing.dealer.businessName, slug: listing.dealer.slug } : null}
            />
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-400">
              <UserRound className="size-3.5" /> Ad posted by {[listing.user.profile?.firstName, listing.user.profile?.lastName].filter(Boolean).join(" ") || "a Garidekho member"}
            </p>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">You may also like</p>
                <h2 className="mt-2 font-display text-2xl font-extrabold">Similar vehicles</h2>
              </div>
              <Link href="/search" className="text-sm font-bold text-link hover:underline">See all</Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {related.map((item) => <ListingCard key={item.id} listing={toListingCard(item)} />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
