import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalisePhone } from "@/lib/services/sms";
import { ROLE_LABELS } from "@/lib/constants";
import { firstError } from "@/lib/validation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};

const settingsSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80, "Name is too long"),
  phone: z.string().trim().optional(),
});

type SearchParams = { saved?: string; error?: string };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/settings");

  const { saved, error } = await searchParams;

  async function updateSettings(formData: FormData) {
    "use server";

    // Re-check auth inside the action: Server Functions are directly reachable.
    const current = await getSessionUser();
    if (!current) redirect("/login?next=/dashboard/settings");

    const parsed = settingsSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
    });
    if (!parsed.success) {
      redirect(`/dashboard/settings?error=${encodeURIComponent(firstError(parsed.error))}`);
    }

    const phone = parsed.data.phone ? normalisePhone(parsed.data.phone) : null;
    if (phone && !/^\+92\d{10}$/.test(phone)) {
      redirect("/dashboard/settings?error=Enter+a+valid+Pakistani+mobile+number");
    }

    if (phone) {
      const existing = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
      if (existing && existing.id !== current.id) {
        redirect("/dashboard/settings?error=That+phone+number+is+already+in+use");
      }
    }

    const [firstName, ...rest] = parsed.data.name.split(/\s+/);
    await prisma.user.update({
      where: { id: current.id },
      data: {
        phone,
        profile: {
          // The schema stores display names on UserProfile, not User.name.
          upsert: {
            create: { firstName, lastName: rest.join(" ") },
            update: { firstName, lastName: rest.join(" ") },
          },
        },
      },
    });

    revalidatePath("/dashboard/settings");
    redirect("/dashboard/settings?saved=1");
  }

  const currentName = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ");
  const isVerified = Boolean(user.profile?.phoneVerifiedAt || user.profile?.emailVerifiedAt);

  return (
    <div className="container-gdk max-w-3xl py-8 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">Your account</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Account settings</h1>
      <p className="mt-2 text-sm text-ink-500">Keep your contact details up to date so buyers and sellers can reach you.</p>

      {saved === "1" && (
        <p role="status" className="surface-card mt-6 rounded-xl border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
          Your settings were saved.
        </p>
      )}
      {error && (
        <p role="alert" className="surface-card mt-6 rounded-xl border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <form action={updateSettings} className="surface-card mt-6 space-y-6 rounded-xl p-5 sm:p-7">
        <div>
          <h2 className="font-display text-lg font-bold">Profile</h2>
          <p className="mt-1 text-sm text-ink-500">This name is shown on your ads and messages.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-name">Full name</Label>
          <Input
            id="settings-name"
            name="name"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            defaultValue={currentName}
            placeholder="Ahmed Raza"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-email">Email address</Label>
          <Input id="settings-email" type="email" value={user.email} readOnly disabled className="bg-ink-50" />
          <p className="text-xs text-ink-500">Email changes require verification — contact support if you need to update it.</p>
        </div>

        <div>
          <h2 className="font-display text-lg font-bold">Contact</h2>
          <p className="mt-1 text-sm text-ink-500">Used only for account-related updates and verification.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-phone">Mobile number</Label>
          <Input
            id="settings-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            defaultValue={user.phone ?? ""}
            placeholder="03001234567"
          />
          <p className="text-xs text-ink-500">Local and +92 formats are both accepted.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-ink-100 pt-5">
          <Button type="submit">Save changes</Button>
          <Badge variant="neutral">{ROLE_LABELS[user.roleName] ?? user.roleName}</Badge>
          {isVerified && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="size-4" /> Verified account
            </span>
          )}
        </div>
      </form>

      <p className="mt-4 text-xs text-ink-500">
        Need to change your password? Use the{" "}
        <a href="/contact" className="font-semibold text-link hover:underline">contact page</a>{" "}
        and our support team will help you securely.
      </p>
    </div>
  );
}
