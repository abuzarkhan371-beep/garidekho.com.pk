import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SITE_URL } from "@/lib/constants";
import { getSiteCustomizer } from "@/lib/customizer/server";
import Link from "next/link";
import { getCustomFontLinks, buildThemeVariables } from "@/lib/customizer/theme";
import { renderCustomizerText } from "@/lib/customizer/config";

const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-heading", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteCustomizer();
  const siteName = renderCustomizerText(config.content.siteName);
  const favicon = config.media.favicon || null;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${siteName} — Cars, Bikes & Auto Parts for Sale in Pakistan`,
      template: `%s | ${siteName}`,
    },
    description:
      "Browse cars for sale in Pakistan, compare price in Pakistan across verified listings, and buy or sell cars, bikes and auto parts in Lahore, Karachi, Islamabad and beyond on Garidekho.",
    keywords: [
      "cars for sale in Pakistan", "used car for sale in Pakistan", "price in Pakistan",
      "car price in Pakistan", "bikes for sale in Pakistan", "garidekho",
      "car marketplace Pakistan", "Toyota Corolla for sale", "used cars Lahore",
    ],
    authors: [{ name: siteName }],
    applicationName: siteName,
    alternates: { canonical: "/" },
    icons: favicon
      ? { icon: [{ url: favicon, sizes: "any" }], shortcut: favicon }
      : undefined,
    openGraph: {
      type: "website",
      locale: "en_PK",
      url: SITE_URL,
      siteName,
      title: `${siteName} — Pakistan's trusted automotive marketplace`,
      description: "Find cars for sale in Pakistan, compare prices and explore verified listings across the country.",
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} — Pakistan's trusted automotive marketplace`,
      description: "Find cars for sale in Pakistan, compare prices and explore verified listings across the country.",
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const config = await getSiteCustomizer();
  const variables = buildThemeVariables(config);
  const fontLinks = getCustomFontLinks(config);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: renderCustomizerText(config.content.siteName),
    alternateName: "Garidekho.com.pk",
    url: SITE_URL,
    description: "Trusted marketplace for cars for sale in Pakistan, used cars and auto parts, with verified listings nationwide.",
    inLanguage: "en-PK",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${inter.variable} ${jakarta.variable}`}
      style={variables as React.CSSProperties}
    >
      {fontLinks.map((href) => <link key={href} rel="stylesheet" href={href} />)}
      <body className="min-h-screen antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ThemeProvider>
          <ToastProvider>
            {config.settings.announcement.enabled && config.settings.announcement.text.trim() && (
              <div
                className={`gdk-announcement px-4 py-2 text-center text-xs font-semibold ${
                  config.settings.announcement.tone === "warning"
                    ? "bg-orange-500 text-white"
                    : config.settings.announcement.tone === "success"
                      ? "bg-emerald-600 text-white"
                      : "bg-navy text-white dark:bg-cta-ink"
                }`}
                role="status"
              >
                {config.settings.announcement.href.trim() ? (
                  config.settings.announcement.href.startsWith("/") ? (
                    <Link href={config.settings.announcement.href} className="hover:underline">
                      {renderCustomizerText(config.settings.announcement.text)}
                    </Link>
                  ) : (
                    <a
                      href={config.settings.announcement.href}
                      className="hover:underline"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {renderCustomizerText(config.settings.announcement.text)}
                    </a>
                  )
                ) : (
                  renderCustomizerText(config.settings.announcement.text)
                )}
              </div>
            )}
            <Header />
            <main id="content">{children}</main>
            <Footer />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
