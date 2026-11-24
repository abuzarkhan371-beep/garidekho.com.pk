import "server-only";
import { cookies } from "next/headers";
import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { User, UserProfile, Role, RolePermission, Dealer } from "@/generated/prisma/client";

export const SESSION_COOKIE = "gdk_session";
export const GUEST_SESSION_COOKIE = "gdk_guest_session";
export const GUEST_EMAIL_DOMAIN = "@guests.garidekho.local";
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_DAYS ?? 30) * 24 * 60 * 60 * 1000;

export type SessionUser = User & {
  profile: UserProfile | null;
  dealer: Dealer | null;
  role: Role & { permissions: RolePermission[] };
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string | null) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

async function createSessionWithCookie(userId: string, cookieName: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  await prisma.session.create({
    data: { userId, tokenHash, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return token;
}

export async function createSession(userId: string) {
  return createSessionWithCookie(userId, SESSION_COOKIE);
}

export async function createGuestSession(userId: string) {
  return createSessionWithCookie(userId, GUEST_SESSION_COOKIE);
}

/** Creates a limited, passwordless identity used only to own guest-created listings. */
export async function createGuestUser(phone: string, name = "Guest Seller") {
  const [firstName, ...rest] = name.trim().split(/\s+/);
  return prisma.user.create({
    data: {
      email: `guest+${randomUUID()}${GUEST_EMAIL_DOMAIN}`,
      phone,
      passwordHash: null,
      roleName: "USER",
      profile: {
        create: {
          firstName: firstName || "Guest",
          lastName: rest.join(" "),
          phoneVerifiedAt: new Date(),
        },
      },
    },
  });
}

export function isGuestUser(user: Pick<User, "email" | "passwordHash">) {
  return user.email.endsWith(GUEST_EMAIL_DOMAIN) && user.passwordHash === null;
}

export async function clearGuestSession() {
  const store = await cookies();
  const token = store.get(GUEST_SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  store.delete(GUEST_SESSION_COOKIE);
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  store.delete(SESSION_COOKIE);

  const guestToken = store.get(GUEST_SESSION_COOKIE)?.value;
  if (guestToken) {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(guestToken) } });
  }
  store.delete(GUEST_SESSION_COOKIE);
}

async function getUserFromCookie(cookieName: string): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: {
      user: {
        include: {
          profile: true,
          dealer: true,
          role: { include: { permissions: true } },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date() || session.user.status !== "ACTIVE" || session.user.deletedAt) {
    return null;
  }
  return session.user;
}

export async function getSessionUser() {
  return getUserFromCookie(SESSION_COOKIE);
}

export async function getGuestUser() {
  return getUserFromCookie(GUEST_SESSION_COOKIE);
}

/** Returns the signed-in user when present, otherwise a verified guest seller identity. */
export async function getSessionActor(): Promise<{ user: SessionUser; isGuest: boolean } | null> {
  const user = await getSessionUser();
  if (user) return { user, isGuest: false };
  const guest = await getGuestUser();
  return guest ? { user: guest, isGuest: true } : null;
}

export function hasPermission(user: SessionUser | null, permission: string) {
  if (!user) return false;
  return user.role.permissions.some((item) => item.permissionKey === permission);
}

export function hasRole(user: SessionUser | null, ...roles: string[]) {
  if (!user) return false;
  return roles.includes(user.roleName);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requirePermission(permission: string): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasPermission(user, permission)) throw new Error("FORBIDDEN");
  return user;
}

// ---------------------------------------------------------------------------
// OTP helpers — provider-agnostic. Codes are HMAC-hashed at rest and expire.
// ---------------------------------------------------------------------------

function otpHash(identifier: string, purpose: string, code: string) {
  const secret = process.env.AUTH_SECRET ?? "dev-secret";
  return createHmac("sha256", secret).update(`${identifier}:${purpose}:${code}`).digest("hex");
}

export async function issueOtp(identifier: string, purpose: string) {
  const code = String(randomInt(100000, 1000000));
  await prisma.otpCode.create({
    data: {
      identifier,
      purpose,
      codeHash: otpHash(identifier, purpose, code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  return code;
}

export async function verifyOtp(identifier: string, purpose: string, code: string) {
  const record = await prisma.otpCode.findFirst({
    where: { identifier, purpose, verifiedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!record || record.attempts >= record.maxAttempts) return false;

  const candidate = Buffer.from(otpHash(identifier, purpose, code), "hex");
  const expected = Buffer.from(record.codeHash, "hex");
  const valid = candidate.length === expected.length && timingSafeEqual(candidate, expected);

  await prisma.otpCode.update({
    where: { id: record.id },
    data: valid ? { verifiedAt: new Date() } : { attempts: { increment: 1 } },
  });
  return valid;
}

export function issueVerificationToken() {
  return randomBytes(32).toString("hex");
}

export function hashVerificationToken(token: string) {
  return sha256(token);
}
