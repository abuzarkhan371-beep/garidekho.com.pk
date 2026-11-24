import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await params;
  const listing = await prisma.listing.findFirst({ where: { id, status: "ACTIVE", deletedAt: null }, select: { id: true } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const existing = await prisma.favourite.findUnique({
    where: { userId_listingId: { userId: user.id, listingId: id } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.favourite.delete({ where: { id: existing.id } }),
      prisma.listing.update({ where: { id }, data: { favoriteCount: { decrement: 1 } } }),
    ]);
    return NextResponse.json({ saved: false });
  }

  await prisma.$transaction([
    prisma.favourite.create({ data: { userId: user.id, listingId: id } }),
    prisma.listing.update({ where: { id }, data: { favoriteCount: { increment: 1 } } }),
  ]);
  return NextResponse.json({ saved: true });
}
