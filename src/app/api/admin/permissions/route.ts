import { NextResponse } from "next/server";
import { getSessionUser, hasPermission } from "@/lib/auth";

/** Lightweight capability check used to show admin edit links without making public pages dynamic. */
export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json(
    {
      canManageCms: Boolean(user && hasPermission(user, "cms.manage")),
      canPromote: Boolean(user && hasPermission(user, "listing.promote")),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
