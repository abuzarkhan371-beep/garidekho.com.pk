import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { firstError, reportSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });

  const listingId = typeof body.listingId === "string" ? body.listingId : null;
  if (listingId) {
    const exists = await prisma.listing.findFirst({ where: { id: listingId, deletedAt: null }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const actor = await getSessionActor();
  await prisma.report.create({
    data: {
      listingId,
      reporterId: actor && !actor.isGuest ? actor.user.id : null,
      reason: parsed.data.reason,
      details: parsed.data.details || null,
    },
  });

  return NextResponse.json({ message: "Thanks. Our moderation team will review this report." }, { status: 201 });
}
