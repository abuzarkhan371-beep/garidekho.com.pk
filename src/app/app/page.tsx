import type { Metadata } from "next";
import Link from "next/link";
import { Apple, Chrome, Download, Monitor, Smartphone } from "lucide-react";
import { PageHero, ContentSection } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "Install the Garidekho App — add to home screen",
  description: "Install Garidekho on Android, iPhone, Windows or macOS. Follow platform-specific add-to-home-screen steps and access the generated web app manifest.",
  alternates: { canonical: "/app" },
};

const steps = [
  {
    icon: Smartphone,
    platform: "Android — Chrome",
    instructions: [
      "Open garidekho.com.pk in Chrome on your Android phone.",
      "Tap the three-dot menu, then choose Install app or Add to Home screen.",
      "Confirm the prompt; the Garidekho icon appears in your app drawer.",
    ],
  },
  {
    icon: Apple,
    platform: "iPhone & iPad — Safari",
    instructions: [
      "Open garidekho.com.pk in Safari.",
      "Tap the Share button (square with an upward arrow).",
      "Choose Add to Home Screen, confirm the name and tap Add.",
    ],
  },
  {
    icon: Monitor,
    platform: "Windows — Chrome or Edge",
    instructions: [
      "Open the site in Chrome or Edge on your desktop.",
      "Click the install icon in the address bar, or use the browser menu → Save and share → Install this site as an app.",
      "The app opens in its own window from your Start menu.",
    ],
  },
  {
    icon: Chrome,
    platform: "macOS — Chrome or Edge",
    instructions: [
      "Open the site in Chrome or Edge.",
      "Use the address-bar install icon or the browser menu → Cast, save and share → Install page as app.",
      "Find Garidekho in Applications or Launchpad.",
    ],
  },
];

export default function AppInstallPage() {
  return (
    <>
      <PageHero
        eyebrow="Mobile app"
        title="Take Garidekho with you"
        description="Garidekho is a web app: install it from your browser without downloading a package from an app store. The site declares a web app manifest so your device can add a proper home-screen icon."
        breadcrumb={[{ label: "Install app", href: "/app" }]}
      />

      <div className="container-gdk space-y-10 py-10 lg:py-14">
        <div className="grid gap-5 md:grid-cols-2">
          {steps.map(({ icon: Icon, platform, instructions }) => (
            <section key={platform} className="surface-card rounded-xl p-6">
              <div className="flex items-center gap-2"><Icon className="size-5 text-link" /><h2 className="font-display text-base font-bold">{platform}</h2></div>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                {instructions.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </section>
          ))}
        </div>

        <ContentSection title="What the installed app can do">
          <p>
            The home-screen shortcut opens the same Garidekho website in a standalone window. You can search listings,
            save favourites, message sellers, use calculators and check verification from there. Any change you make to
            your account appears on the website too — it is one account and one catalogue.
          </p>
          <p>
            If your browser does not show an install option, make sure you are using a current version of Chrome, Edge or
            Safari and that the site is opened over HTTPS. You can still bookmark the site and use every feature in the
            browser.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="/manifest.webmanifest" className="inline-flex h-10 items-center gap-2 rounded-xl bg-cta px-4 text-sm font-semibold text-white hover:bg-cta-hover">
              <Download className="size-4" /> View web app manifest
            </a>
            <Link href="/help" className="inline-flex h-10 items-center rounded-xl border border-ink-200 px-4 text-sm font-semibold hover:border-link hover:text-link dark:border-ink-700">
              Get help
            </Link>
          </div>
        </ContentSection>
      </div>
    </>
  );
}
