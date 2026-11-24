import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Eye, Tag } from "lucide-react";
import { prisma } from "@/lib/db";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/content/page-hero";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const articles = await prisma.newsArticle.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.newsArticle.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, seoTitle: true, seoDescription: true, coverUrl: true, publishedAt: true, status: true },
  });
  if (!article || article.status !== "PUBLISHED") return { title: "Article not found" };

  const title = article.seoTitle ?? article.title;
  const description = article.seoDescription ?? article.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `/news/${slug}` },
    openGraph: {
      title,
      description,
      url: `/news/${slug}`,
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      images: article.coverUrl ? [article.coverUrl] : undefined,
    },
  };
}

function formatDate(date: Date | null) {
  if (!date) return "Draft";
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await prisma.newsArticle.findUnique({ where: { slug } });
  if (!article || article.status !== "PUBLISHED") notFound();

  const related = await prisma.newsArticle.findMany({
    where: { status: "PUBLISHED", id: { not: article.id } },
    select: { title: true, slug: true, excerpt: true, category: true },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  const paragraphs = article.content.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt?.toISOString(),
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/news/${article.slug}`,
    ...(article.coverUrl ? { image: article.coverUrl } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero
        eyebrow={article.category ?? "Automotive news"}
        title={article.title}
        description={article.excerpt}
        breadcrumb={[{ label: "News", href: "/news" }, { label: article.title, href: `/news/${article.slug}` }]}
      >
        <div className="flex flex-wrap items-center gap-4 text-xs text-ink-500 dark:text-ink-400">
          <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> {formatDate(article.publishedAt)}</span>
          <span className="flex items-center gap-1"><Eye className="size-3.5" /> {article.views} views</span>
        </div>
      </PageHero>

      <div className="container-gdk grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:py-14">
        <article>
          {article.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.coverUrl} alt={article.title} className="mb-8 aspect-[16/9] w-full rounded-xl object-cover" />
          )}
          <div className="max-w-3xl space-y-5">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="text-base leading-8 text-ink-700 dark:text-ink-200">{paragraph}</p>
            ))}
          </div>

          {article.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-6 dark:border-ink-800">
              <Tag className="size-3.5 text-ink-400" />
              {article.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
            </div>
          )}

          <div className="mt-8 rounded-xl border border-signal-100 bg-signal-50 p-5 dark:border-link/30 dark:bg-link/10">
            <h2 className="font-display text-base font-bold text-ink-950 dark:text-white">Ready to put this advice into practice?</h2>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
              Browse verified cars for sale in Pakistan, compare price in Pakistan with our estimator, or post your own ad.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href="/search" className="inline-flex h-9 items-center rounded-xl bg-cta px-3 text-xs font-semibold text-white hover:bg-cta-hover">Search vehicles</Link>
              <Link href="/estimate" className="inline-flex h-9 items-center rounded-xl border border-ink-200 px-3 text-xs font-semibold hover:border-link dark:border-ink-700">Estimate a price</Link>
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <div className="surface-card rounded-xl p-5">
            <h2 className="font-display text-sm font-bold">More from Garidekho</h2>
            <div className="mt-3 space-y-3">
              {related.length > 0 ? related.map((item) => (
                <Link key={item.slug} href={`/news/${item.slug}`} className="group block border-b border-ink-100 pb-3 last:border-0 last:pb-0 dark:border-ink-800">
                  <span className="block text-xs font-semibold text-ink-800 group-hover:text-link dark:text-ink-100 dark:group-hover:text-link-soft">{item.title}</span>
                  <span className="mt-0.5 block text-[0.7rem] text-ink-400">{item.category ?? "Article"}</span>
                </Link>
              )) : <p className="text-xs text-ink-500">No other published articles yet.</p>}
            </div>
          </div>
          <Link href="/news" className="inline-flex items-center gap-1 text-xs font-semibold text-link hover:underline dark:text-link-soft">
            <ArrowLeft className="size-3.5" /> Back to all articles
          </Link>
        </aside>
      </div>
    </>
  );
}
