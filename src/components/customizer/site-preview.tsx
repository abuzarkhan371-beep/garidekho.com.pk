import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, Search, ShieldCheck } from "lucide-react";
import { DEFAULT_CUSTOMIZER_CONFIG, renderCustomizerText, type SiteCustomizerConfig } from "@/lib/customizer/config";

/** A lightweight, data-free mirror of the homepage used inside the visual editor iframe. */
export function SitePreview({ config }: { config: SiteCustomizerConfig }) {
  const heroImage = config.media.heroBanner || DEFAULT_CUSTOMIZER_CONFIG.media.heroBanner;
  const siteName = renderCustomizerText(config.content.siteName);

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink-900)]">
      <span className="fixed right-3 top-3 z-50 rounded-md bg-ink-950/90 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-white">
        Preview
      </span>

      <div className="flex items-center justify-between bg-[var(--gdk-ink-950-base)] px-5 py-1.5 text-[0.62rem] text-white/80">
        <span>Pakistan&apos;s verified automotive marketplace</span>
        <span>Find a Dealer · Car Inspection · Help Center</span>
      </div>

      <header
        className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--color-ink-100)] px-5 py-3"
        style={{ backgroundColor: "var(--gdk-header)", color: "var(--gdk-header-fg)" }}
      >
        <div className="flex items-center gap-2.5">
          {config.media.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.media.logo} alt="" className="size-8 rounded-lg object-contain" />
          ) : (
            <span
              className="flex size-8 items-center justify-center rounded-lg font-display text-lg font-extrabold text-white"
              style={{ background: "linear-gradient(135deg, var(--color-ink-900), var(--color-teal-600))" }}
            >
              G
            </span>
          )}
          <span className="font-display text-base font-extrabold">{siteName}</span>
        </div>
        <nav className="hidden items-center gap-4 text-xs font-semibold sm:flex">
          <span>Buy a Car</span><span>Sell a Car</span><span>Bikes</span><span>Auto Parts</span>
        </nav>
        <span
          className="rounded-lg px-3 py-1.5 text-[0.65rem] font-bold text-white"
          style={{ backgroundColor: "var(--color-teal-600)" }}
        >
          {renderCustomizerText(config.content.ctaButton)}
        </span>
      </header>

      <section className="relative overflow-hidden px-5 py-10 text-white" style={{ backgroundColor: "var(--gdk-ink-950-base)" }}>
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url("${heroImage}")` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--color-signal-300)]">
            Now live across Pakistan
          </p>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            {renderCustomizerText(config.content.heroTitle)}{" "}
            <span className="text-[var(--color-teal-300)]">{renderCustomizerText(config.content.heroAccent)}</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/80">{renderCustomizerText(config.content.heroSubtitle)}</p>

          <div className="mt-6 rounded-xl bg-white p-3 text-[var(--color-ink-900)] shadow-lg">
            <div className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-200)] px-3 py-2">
              <Search className="size-4 text-[var(--color-ink-400)]" />
              <span className="truncate text-xs text-[var(--color-ink-400)]">
                {renderCustomizerText(config.content.searchPlaceholder)}
              </span>
              <span
                className="ml-auto shrink-0 rounded-lg px-3 py-1.5 text-[0.65rem] font-bold text-white"
                style={{ backgroundColor: "var(--color-teal-600)" }}
              >
                {renderCustomizerText(config.content.searchButton)}
              </span>
            </div>
            <div className="mt-2 flex gap-2 text-[0.62rem] font-semibold text-[var(--color-ink-500)]">
              <span>Cars</span><span>Bikes</span><span>Commercial</span><span className="ml-auto">Filters →</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-4 text-[0.65rem] text-white/70">
            <span className="flex items-center gap-1"><ShieldCheck className="size-3" /> Moderated listings</span>
            <span className="flex items-center gap-1"><BadgeCheck className="size-3" /> Verified sellers</span>
            <span className="flex items-center gap-1"><MapPin className="size-3" /> Nationwide coverage</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-8 px-5 py-10">
        {config.media.promoBanners.some((banner) => banner.url) && (
          <div className="grid gap-3 sm:grid-cols-3">
            {config.media.promoBanners.filter((banner) => banner.url).map((banner, index) => (
              <div key={`${banner.url}-${index}`} className="relative aspect-[16/9] overflow-hidden rounded-xl bg-[var(--color-ink-100)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner.url} alt={banner.alt} className="size-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--color-teal-600)]">Fresh arrivals</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">Latest listings</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="overflow-hidden rounded-xl border border-[var(--color-ink-100)] bg-[var(--color-surface)]">
                <div className="skeleton aspect-video" />
                <div className="space-y-2 p-3">
                  <div className="skeleton h-3 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-ink-100)] bg-[var(--color-surface)] p-6">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--color-teal-600)]">Why Garidekho</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">{renderCustomizerText(config.content.aboutTitle)}</h2>
          <p className="mt-2 max-w-xl text-xs text-[var(--color-ink-500)]">{renderCustomizerText(config.content.aboutText)}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl p-6 text-white" style={{ backgroundColor: "var(--color-ink-900)" }}>
            <h2 className="font-display text-lg font-extrabold">{renderCustomizerText(config.content.ctaTitle)}</h2>
            <p className="mt-2 text-xs text-white/70">{renderCustomizerText(config.content.ctaText)}</p>
            <span className="mt-4 inline-flex items-center gap-1 rounded-lg bg-[var(--color-signal-400)] px-3 py-1.5 text-[0.65rem] font-bold text-ink-950">
              {renderCustomizerText(config.content.ctaButton)} <ArrowRight className="size-3" />
            </span>
          </div>
          <div className="rounded-xl bg-[var(--color-teal-700)] p-6 text-white">
            <h2 className="font-display text-lg font-extrabold">Take Garidekho with you</h2>
            <p className="mt-2 text-xs text-white/80">A mobile-first experience for buyers and sellers across Pakistan.</p>
            <Link href="/app" className="mt-4 inline-flex items-center gap-1 text-[0.65rem] font-bold">
              How to install <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      <footer
        className="border-t border-[var(--color-ink-200)] px-5 py-8"
        style={{ backgroundColor: "var(--gdk-footer)", color: "var(--gdk-footer-fg)" }}
      >
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          <div>
            <p className="font-display text-sm font-extrabold">{siteName}</p>
            <p className="mt-2 text-[0.68rem] opacity-70">{renderCustomizerText(config.content.footerAbout)}</p>
          </div>
          <div className="text-[0.68rem] opacity-70">
            <p>{config.content.contactAddress}</p>
            <p className="mt-1">{config.content.contactPhone}</p>
            <p className="mt-1">{config.content.contactEmail}</p>
          </div>
          <div className="text-[0.68rem] opacity-70">
            <p className="font-bold opacity-100">Explore</p>
            <p className="mt-1">Buy · Sell · Research · Company</p>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-5xl border-t border-[var(--color-ink-200)] pt-4 text-[0.65rem] opacity-60">
          {renderCustomizerText(config.content.copyright)}
        </p>
      </footer>
    </div>
  );
}
