import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Eye, Newspaper } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "Auto News & Buying Guides — Pakistan",
  description: "Read automotive news, used-car buying guides and car price in Pakistan insights for buyers and sellers, published by the Garidekho editorial team.",
  keywords: ["car price in Pakistan", "used car buying guide Pakistan", "Pakistan auto news"],
  alternates: { canonical: "/news" },
};

function formatDate(date: Date | null) {
  if (!date) return "Draft";
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export default async function NewsPage() {
  const articles = await prisma.newsArticle.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true, title: true, slug: true, excerpt: true, coverUrl: true, category: true,
      tags: true, publishedAt: true, views: true,
    },
    orderBy: { publishedAt: "desc" },
  });

  const categories = Array.from(new Set(articles.map((article) => article.category).filter((value): value is string => Boolean(value))));

  return (
    <>
      <PageHero
        eyebrow="News & guides"
        title="Automotive news and practical guides"
        description="Research, buying advice, used car price in Pakistan insights and market updates for Pakistani car buyers and sellers. Every article below is published and stored in our editorial system."
        breadcrumb={[{ label: "News", href: "/news" }]}
      >
        <p className="text-sm font-semibold text-ink-600 dark:text-ink-300">{articles.length} published articles</p>
      </PageHero>

      <div className="container-gdk space-y-10 py-10 lg:py-14">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => <Badge key={category} variant="neutral">{category}</Badge>)}
          </div>
        )}

        {articles.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article key={article.id} className="surface-card group flex flex-col overflow-hidden rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-float">
                {article.coverUrl && (
                  <div className="aspect-[16/9] overflow-hidden bg-ink-100 dark:bg-ink-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={article.coverUrl} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    {article.category && <Badge variant="default">{article.category}</Badge>}
                    <span className="flex items-center gap-1"><CalendarDays className="size-3" /> {formatDate(article.publishedAt)}</span>
                  </div>
                  <h2 className="mt-3 font-display text-lg font-bold leading-snug text-ink-950 group-hover:text-link dark:text-white dark:group-hover:text-link-soft">
                    <Link href={`/news/${article.slug}`}>{article.title}</Link>
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{article.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-xs text-ink-400"><Eye className="size-3" /> {article.views} views</span>
                    <Link href={`/news/${article.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-link hover:underline dark:text-link-soft">
                      Read article <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="surface-card rounded-xl p-8 text-center">
            <Newspaper className="mx-auto size-8 text-ink-300" />
            <h2 className="mt-3 font-display text-lg font-bold">No published articles yet</h2>
            <p className="mt-2 text-sm text-ink-500">Our editorial team is working on the first guides. Check back soon.</p>
          </div>
        )}
      </div>
    </>
  );
}
