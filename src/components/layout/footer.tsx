import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";
import { renderCustomizerText } from "@/lib/customizer/config";
import { getSiteCustomizer } from "@/lib/customizer/server";

const columns = [
  {
    title: "Buy",
    links: [
      ["Cars for sale", "/cars"], ["Bikes for sale", "/bikes"], ["Commercial vehicles", "/commercial-vehicles"],
      ["Auto parts", "/auto-parts"], ["Accessories", "/accessories"], ["Browse by city", "/cities"],
    ],
  },
  {
    title: "Sell",
    links: [
      ["Post an ad", "/sell"], ["Dealer portal", "/dealer"], ["Pricing & packages", "/pricing"],
      ["Seller guide", "/guides/sell-car-fast-safely-pakistan"], ["Verification", "/verification"],
    ],
  },
  {
    title: "Research",
    links: [
      ["News & reviews", "/news"], ["Car valuation", "/estimate"], ["EMI calculator", "/emi-calculator"],
      ["Vehicle inspection", "/inspection"], ["Compare cars", "/compare"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About us", "/about"], ["Contact", "/contact"], ["Privacy policy", "/privacy-policy"],
      ["Terms of use", "/terms-of-use"], ["Help center", "/help"],
    ],
  },
];

export async function Footer() {
  const config = await getSiteCustomizer();
  const siteName = renderCustomizerText(config.content.siteName);
  const chromeStyle = {
    backgroundColor: "var(--gdk-footer)",
    "--gdk-chrome-fg": "var(--gdk-footer-fg)",
  } as React.CSSProperties;

  return (
    <footer className="gdk-chrome mt-20 border-t border-ink-200" style={chromeStyle}>
      <div className="container-gdk py-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_3fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark src={config.media.logo} />
              <span className="font-display text-xl font-extrabold tracking-tight">{siteName}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500">
              {renderCustomizerText(config.content.footerAbout)}
            </p>
            <div className="mt-5 space-y-2 text-sm text-ink-500">
              {config.content.contactAddress && (
                <p className="flex items-center gap-2"><MapPin className="size-4 text-orange-500" /> {config.content.contactAddress}</p>
              )}
              {config.content.contactPhone && (
                <p className="flex items-center gap-2"><Phone className="size-4 text-orange-500" /> {config.content.contactPhone}</p>
              )}
              {config.content.contactEmail && (
                <p className="flex items-center gap-2"><Mail className="size-4 text-orange-500" /> {config.content.contactEmail}</p>
              )}
            </div>
            <div className="mt-5 flex gap-2">
              {[Facebook, Instagram, Youtube, Linkedin].map((Icon, index) => (
                <Link
                  key={index}
                  href="/contact"
                  className="flex size-9 items-center justify-center rounded-lg border border-ink-200 transition-colors hover:border-link-soft hover:text-link-soft"
                  aria-label="Social link"
                >
                  <Icon className="size-4" />
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="mb-3 text-sm font-bold">{column.title}</h3>
                <ul className="space-y-2.5">
                  {column.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-ink-500 transition-colors hover:text-link-soft">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-ink-100 pt-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>{renderCustomizerText(config.content.copyright)}</p>
          <p>Made in Pakistan for Pakistan&apos;s automotive community.</p>
        </div>
      </div>
    </footer>
  );
}
