"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  clearGuestSession, createGuestSession, createGuestUser, createSession, hashPassword,
  hashVerificationToken, isGuestUser, issueOtp, issueVerificationToken, verifyOtp, verifyPassword,
} from "@/lib/auth";
import { normalisePhone } from "@/lib/services/sms";
import { sendEmail, passwordResetEmail, verificationEmail } from "@/lib/services/mail";
import { sendSms } from "@/lib/services/sms";
import {
  firstError, forgotPasswordSchema, loginSchema, otpRequestSchema, otpVerifySchema,
  registerSchema, resetPasswordSchema,
} from "@/lib/validation";
import { SITE_URL } from "@/lib/constants";

export type AuthState = {
  error?: string;
  message?: string;
  code?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
};

function fieldErrors(error: z.ZodError) {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    include: { profile: true },
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Invalid email or password" };
  }
  if (user.status !== "ACTIVE" || user.deletedAt) {
    return { error: "This account is not active. Please contact support." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  const next = String(formData.get("next") ?? "/dashboard");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };

  const email = parsed.data.email.toLowerCase();
  const phone = normalisePhone(parsed.data.phone);
  const [firstName, ...rest] = parsed.data.name.split(" ");
  const passwordHash = await hashPassword(parsed.data.password);

  const [byEmail, byPhone] = await Promise.all([
    prisma.user.findUnique({ where: { email }, include: { profile: true } }),
    prisma.user.findUnique({ where: { phone }, include: { profile: true } }),
  ]);

  if ((byEmail && !isGuestUser(byEmail)) || (byPhone && !isGuestUser(byPhone))) {
    return { error: "An account with this email or phone number already exists" };
  }

  // Convert the passwordless guest identity into a real account so published ads are kept.
  const guest = byPhone ?? byEmail;
  if (guest) {
    await prisma.user.update({
      where: { id: guest.id },
      data: {
        email,
        phone,
        passwordHash,
        roleName: "USER",
        profile: {
          upsert: {
            create: { firstName, lastName: rest.join(" "), phoneVerifiedAt: new Date() },
            update: { firstName, lastName: rest.join(" "), phoneVerifiedAt: guest.profile?.phoneVerifiedAt ?? new Date() },
          },
        },
      },
    });
    await clearGuestSession();
    await createSession(guest.id);
    redirect("/dashboard?welcome=1&claimed=1");
  }

  const user = await prisma.user.create({
    data: {
      email,
      phone,
      passwordHash,
      profile: {
        create: {
          firstName,
          lastName: rest.join(" "),
          emailVerifiedAt: null,
        },
      },
    },
  });

  const token = issueVerificationToken();
  await prisma.verificationToken.create({
    data: { userId: user.id, tokenHash: hashVerificationToken(token), purpose: "EMAIL_VERIFY", expiresAt: new Date(Date.now() + 24 * 3600_000) },
  });
  await sendEmail(email, "Verify your Garidekho email", verificationEmail(firstName, `${SITE_URL}/verify-email?token=${token}`));
  await createSession(user.id);
  redirect("/dashboard?welcome=1");
}

export async function requestOtpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = otpRequestSchema.safeParse({ phone: normalisePhone(String(formData.get("phone") ?? "")) });
  if (!parsed.success) return { error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };

  const purpose = String(formData.get("purpose") ?? "PHONE_VERIFY");
  const code = await issueOtp(parsed.data.phone, purpose);
  await sendSms(parsed.data.phone, `Your Garidekho verification code is ${code}. It expires in 10 minutes. Never share this code.`);
  return {
    message: `We sent a 6-digit code to ${parsed.data.phone}`,
    ...(process.env.SMS_PROVIDER === "console" ? { code } : {}),
  };
}

export async function verifyOtpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const phone = normalisePhone(String(formData.get("phone") ?? ""));
  const parsed = otpVerifySchema.safeParse({ phone, code: String(formData.get("code") ?? "") });
  if (!parsed.success) return { error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };

  const purpose = String(formData.get("purpose") ?? "PHONE_VERIFY");
  const valid = await verifyOtp(phone, purpose, parsed.data.code);
  if (!valid) return { error: "Incorrect or expired verification code" };

  if (purpose === "PHONE_LOGIN") {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return { error: "No account found for this phone number. Please register first." };
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createSession(user.id);
    redirect("/dashboard");
  }

  if (purpose === "GUEST_LISTING_PHONE") {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing && !isGuestUser(existing)) {
      return { error: "This number is already registered. Sign in to continue, or use another number." };
    }
    const guest = existing ?? (await createGuestUser(phone));
    await createGuestSession(guest.id);
    return { success: true, message: "Phone verified. You can now post your ad without an account." };
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (user) {
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: { phoneVerifiedAt: new Date() },
      create: { userId: user.id, phoneVerifiedAt: new Date() },
    });
  }
  redirect("/dashboard?verified=phone");
}

export async function forgotPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = forgotPasswordSchema.safeParse({ email: String(formData.get("email") ?? "") });
  if (!parsed.success) return { error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() }, include: { profile: true } });
  if (!user) return { message: "If that email is registered, a reset link has been sent." };

  const token = issueVerificationToken();
  await prisma.verificationToken.create({
    data: { userId: user.id, tokenHash: hashVerificationToken(token), purpose: "PASSWORD_RESET", expiresAt: new Date(Date.now() + 3600_000) },
  });
  await sendEmail(
    user.email,
    "Reset your Garidekho password",
    passwordResetEmail(user.profile?.firstName ?? "there", `${SITE_URL}/reset-password?token=${token}`),
  );
  return { message: "If that email is registered, a reset link has been sent." };
}

export async function resetPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetPasswordSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };

  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: hashVerificationToken(parsed.data.token) },
  });
  if (!record || record.purpose !== "PASSWORD_RESET" || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  redirect("/login?reset=1");
}

export async function verifyEmailAction(token: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: hashVerificationToken(token) },
  });
  if (!record || record.purpose !== "EMAIL_VERIFY" || record.usedAt || record.expiresAt < new Date()) return false;
  await prisma.$transaction([
    prisma.userProfile.update({ where: { userId: record.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return true;
}
