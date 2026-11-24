import Link from "next/link";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";

export function AuthShell({
  title, subtitle, children, footer,
}: { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="container-gdk grid min-h-[calc(100vh-8rem)] items-center gap-10 py-12 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <BrandMark />
          <span className="font-display text-xl font-extrabold tracking-tight">gari<span className="text-cta-ink">dekho</span></span>
        </Link>
        <h1 className="mt-8 font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-ink-500">{subtitle}</p>
        <div className="mt-8 surface-card rounded-xl p-6">{children}</div>
        {footer && <div className="mt-5 text-center text-sm text-ink-500">{footer}</div>}
      </div>

      <div className="relative hidden overflow-hidden rounded-3xl bg-navy p-10 text-white lg:block">
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cta">The Garidekho promise</p>
          <h2 className="mt-4 max-w-md font-display text-4xl font-extrabold leading-tight">
            Transactions built on trust, not just listings.
          </h2>
          <div className="mt-12 space-y-7">
            {[
              { icon: ShieldCheck, title: "Every ad is reviewed", body: "Our moderation team checks each listing before it appears in search." },
              { icon: BadgeCheck, title: "Real, verified sellers", body: "Phone and business verification make accountability visible." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300"><item.icon className="size-5" /></span>
                <div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="mt-1 text-sm text-ink-300">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-16 text-sm text-ink-400">Pakistan&apos;s automotive community, united.</p>
        </div>
      </div>
    </div>
  );
}
