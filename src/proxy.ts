import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { SITE_CUSTOMIZER_KEY } from "@/lib/customizer/config";
import { configFromUnknown } from "@/lib/customizer/theme";

// /sell is intentionally public: guests can verify a phone number and post without an account.
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/dealer", "/messages", "/saved"];
const MAINTENANCE_ALLOWED_PREFIXES = ["/admin", "/login", "/maintenance"];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/** Only staff with admin access may keep working while public pages are in maintenance mode. */
async function isStaffSession(token: string | undefined) {
  if (!token) return false;
  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash: sha256(token) },
      select: {
        expiresAt: true,
        user: {
          select: {
            status: true,
            deletedAt: true,
            role: { include: { permissions: true } },
          },
        },
      },
    });
    if (!session || session.expiresAt < new Date() || session.user.status !== "ACTIVE" || session.user.deletedAt) {
      return false;
    }
    return session.user.role.permissions.some(
      (permission) => permission.permissionKey === "admin.access" || permission.permissionKey === "settings.manage",
    );
  } catch {
    return false;
  }
}

async function maintenanceEnabled() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: SITE_CUSTOMIZER_KEY },
      select: { value: true },
    });
    return setting ? configFromUnknown(setting.value).settings.maintenance.enabled : false;
  } catch {
    // A database hiccup must never take the storefront down with a false maintenance redirect.
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!MAINTENANCE_ALLOWED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    const enabled = await maintenanceEnabled();
    if (enabled) {
      const staff = await isStaffSession(request.cookies.get("gdk_session")?.value);
      if (!staff) return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  const needsAuth = PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
  const hasSession = Boolean(request.cookies.get("gdk_session")?.value);

  if (needsAuth && !hasSession) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
