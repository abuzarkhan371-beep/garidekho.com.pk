import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getSessionActor } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.listing.findFirst({
    where: { id, status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const actor = await getSessionActor();
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip") ?? "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex");
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recent = await prisma.listingView.findFirst({
    where: {
      listingId: listing.id,
      createdAt: { gte: since },
      ...(actor ? { userId: actor.user.id } : { ipHash }),
    },
    select: { id: true },
  });

  if (recent) return NextResponse.json({ counted: false });

  await prisma.$transaction([
    prisma.listingView.create({
      data: {
        listingId: listing.id,
        userId: actor?.user.id ?? null,
        ipHash: actor ? null : ipHash,
        userAgent: headerStore.get("user-agent")?.slice(0, 500) ?? null,
        referrer: headerStore.get("referer")?.slice(0, 500) ?? null,
      },
    }),
    prisma.listing.update({ where: { id: listing.id }, data: { viewCount: { increment: 1 } } }),
  ]);

  return NextResponse.json({ counted: true });
}
