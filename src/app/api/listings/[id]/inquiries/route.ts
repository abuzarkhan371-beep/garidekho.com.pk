import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { firstError, inquirySchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });

  const listing = await prisma.listing.findFirst({
    where: { id, status: "ACTIVE", deletedAt: null },
    select: { id: true, title: true, userId: true },
  });
  if (!listing) return NextResponse.json({ error: "Listing not found or no longer available." }, { status: 404 });

  const actor = await getSessionActor();
  const inquiry = await prisma.inquiry.create({
    data: {
      listingId: listing.id,
      userId: actor && !actor.isGuest ? actor.user.id : null,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone,
      message: parsed.data.message,
    },
  });

  await prisma.notification.create({
    data: {
      userId: listing.userId,
      listingId: listing.id,
      type: "NEW_INQUIRY",
      title: "New buyer inquiry",
      body: `${parsed.data.name} is interested in ${listing.title}.`,
      href: `/dashboard/inquiries`,
    },
  });

  return NextResponse.json({ id: inquiry.id, message: "Your inquiry was sent to the seller." }, { status: 201 });
}
