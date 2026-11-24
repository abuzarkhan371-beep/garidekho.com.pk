import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(new URL("/login?error=google_unavailable", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));

  const state = randomBytes(24).toString("hex");
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  response.cookies.set("gdk_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  return response;
}
