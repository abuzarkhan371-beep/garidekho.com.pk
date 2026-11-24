import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { User } from "@/generated/prisma/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type GoogleTokenResponse = { access_token?: string; error?: string };
type GoogleProfile = { sub: string; email: string; email_verified?: boolean; name?: string; picture?: string };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const store = await cookies();
  const expectedState = store.get("gdk_oauth_state")?.value;
  store.delete("gdk_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?error=oauth_state", SITE_URL));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${SITE_URL}/api/auth/google/callback`;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=google_unavailable", SITE_URL));
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: redirectUri, grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokens.access_token) throw new Error("Token exchange failed");

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    });
    const profile = (await profileResponse.json()) as GoogleProfile;
    if (!profile.sub || !profile.email) throw new Error("Profile fetch failed");

    const existingAccount = await prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider: "GOOGLE", providerAccountId: profile.sub } },
      include: { user: true },
    });

    let user: User | undefined = existingAccount?.user ?? undefined;
    if (!user) {
      user = (await prisma.user.findUnique({ where: { email: profile.email.toLowerCase() } })) ?? undefined;
      if (!user) {
        const [firstName, ...rest] = (profile.name ?? "Garidekho User").split(" ");
        user = await prisma.user.create({
          data: {
            email: profile.email.toLowerCase(),
            profile: {
              create: {
                firstName,
                lastName: rest.join(" "),
                avatarUrl: profile.picture,
                emailVerifiedAt: profile.email_verified ? new Date() : null,
              },
            },
          },
        });
      }
      await prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: "GOOGLE",
          providerAccountId: profile.sub,
          accessToken: tokens.access_token,
        },
      });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createSession(user.id);
    return NextResponse.redirect(new URL("/dashboard", SITE_URL));
  } catch (error) {
    console.error("Google OAuth callback failed", error);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", SITE_URL));
  }
}
