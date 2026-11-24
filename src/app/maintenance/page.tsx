import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Wrench } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";
import { getSiteCustomizer } from "@/lib/customizer/server";
import { renderCustomizerText } from "@/lib/customizer/config";

export const metadata: Metadata = {
  title: "Scheduled maintenance",
  robots: { index: false, follow: false },
};

export default async function MaintenancePage() {
  const config = await getSiteCustomizer();
  const { maintenance } = config.settings;
  const siteName = renderCustomizerText(config.content.siteName);

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-16">
      <div className="surface-card w-full max-w-xl rounded-3xl p-8 text-center sm:p-12">
        <BrandMark className="mx-auto size-12" src={config.media.logo} />
        <div className="mx-auto mt-6 flex size-14 items-center justify-center rounded-xl bg-signal-50 text-link dark:bg-link/10 dark:text-link-soft">
          <Wrench className="size-6" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight">
          {renderCustomizerText(maintenance.title)}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">
          {renderCustomizerText(maintenance.message)}
        </p>
        {maintenance.contactEmail && (
          <p className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-ink-600 dark:text-ink-300">
            <Mail className="size-4 text-link" />
            <a href={`mailto:${maintenance.contactEmail}`} className="hover:text-link hover:underline">
              {maintenance.contactEmail}
            </a>
          </p>
        )}
        <p className="mt-8 text-xs text-ink-400">{siteName} · Scheduled maintenance</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline dark:text-link-soft">
          <ArrowLeft className="size-4" /> Try again
        </Link>
      </div>
    </div>
  );
}
