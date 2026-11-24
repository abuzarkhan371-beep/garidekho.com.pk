import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Newspaper } from "lucide-react";
import { AdminEditLink } from "@/components/admin/admin-edit-link";
import { formatDate } from "@/lib/utils";

type ArticleTeaser = {
  title: string;
  slug: string;
  excerpt: string;
  coverUrl: string | null;
  category: string | null;
  publishedAt: Date | null;
};

export function LatestNewsAbout({
  articles,
  aboutTitle,
  aboutText,
}: {
  articles: ArticleTeaser[];
  aboutTitle: string;
  aboutText: string;
}) {
  return (
    <section aria-labelledby="latest-news-about-title" className="surface-card rounded-3xl p-6 sm:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">Stay in the loop</p>
          <h2 id="latest-news-about-title" className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">
            Latest News &amp; About
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            Fresh stories on car price in Pakistan, buying tips and market updates from Pakistan&apos;s roads.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdminEditLink href="/admin/news" label="Add / edit news" />
          <Link
            href="/news"
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-link dark:text-link-soft"
          >
            All news <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.65fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-3">
          {articles.length > 0 ? articles.map((article) => (
            <Link
              key={article.slug}
              href={`/news/${article.slug}`}
              className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-ink-100 bg-canvas transition-all hover:-translate-y-0.5 hover:border-link hover:shadow-float dark:border-ink-800 dark:bg-ink-900/60"
            >
              <div className="relative aspect-[16/9] bg-ink-100 dark:bg-ink-800">
                {article.coverUrl ? (
                  <Image
                    src={article.coverUrl}
                    alt={article.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 30vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-ink-400">
                    <Newspaper className="size-6" />
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-3.5">
                <div className="flex flex-wrap items-center gap-2 text-[0.65rem] text-ink-400">
                  {article.category && (
                    <span className="font-bold uppercase tracking-wide text-link dark:text-link-soft">{article.category}</span>
                  )}
                  {article.publishedAt && (
                    <span className="flex items-center gap-1"><CalendarDays className="size-3" /> {formatDate(article.publishedAt)}</span>
                  )}
                </div>
                <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug group-hover:text-link dark:group-hover:text-link-soft">
                  {article.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-500">{article.excerpt}</p>
              </div>
            </Link>
          )) : (
            <div className="surface-card col-span-full flex flex-col items-center justify-center rounded-xl p-8 text-center">
              <Newspaper className="size-7 text-ink-300" />
              <p className="mt-2 text-sm font-semibold">First stories are on the way.</p>
              <p className="mt-1 text-xs text-ink-500">Check back soon for buying guides and market updates.</p>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between rounded-2xl bg-navy p-6 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-link-soft">About Garidekho</p>
            <h3 className="mt-3 font-display text-xl font-extrabold leading-snug">{aboutTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-300">{aboutText}</p>
          </div>
          <Link
            href="/about"
            className="mt-6 inline-flex items-center gap-1.5 self-start text-sm font-bold text-white hover:text-link-soft"
          >
            Read our story <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
