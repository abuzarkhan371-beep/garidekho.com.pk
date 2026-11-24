import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  breadcrumb?: { label: string; href: string }[];
  children?: ReactNode;
  className?: string;
};

/** Shared, server-rendered hero for public content and utility pages. */
export function PageHero({ eyebrow, title, description, breadcrumb, children, className }: PageHeroProps) {
  return (
    <section className={cn("border-b border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900", className)}>
      <div className="container-gdk py-10 lg:py-14">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-ink-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-link dark:hover:text-link-soft">Home</Link>
            {breadcrumb.map((item) => (
              <span key={item.href} className="flex items-center gap-1.5">
                <span aria-hidden>/</span>
                <Link href={item.href} className="hover:text-link dark:hover:text-link-soft">{item.label}</Link>
              </span>
            ))}
          </nav>
        )}
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-link dark:text-link-soft">{eyebrow}</p>
        <h1 className="mt-2 max-w-3xl text-balance font-display text-3xl font-extrabold leading-tight text-ink-950 sm:text-4xl lg:text-5xl dark:text-white">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-500 sm:text-base dark:text-ink-300">{description}</p>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

export function ContentSection({
  title,
  children,
  id,
  className,
}: {
  title: string;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24", className)}>
      <h2 className="font-display text-xl font-bold text-ink-950 sm:text-2xl dark:text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{children}</div>
    </section>
  );
}
