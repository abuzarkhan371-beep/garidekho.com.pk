import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewsManager, type NewsOption } from "@/components/admin/news-manager";

export const metadata: Metadata = {
  title: "Manage news — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminNewsPage() {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "cms.manage")) redirect("/admin");

  const rows = await prisma.newsArticle.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const articles: NewsOption[] = rows.map((article) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    coverUrl: article.coverUrl,
    category: article.category,
    tags: article.tags,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    status: article.status,
    publishedAt: article.publishedAt?.toISOString() ?? null,
  }));

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Manage news</h1>
      <p className="mt-1 text-sm text-ink-500">
        Add, edit and publish articles with cover photos for the Latest News section.
      </p>
      <div className="mt-6">
        <NewsManager articles={articles} />
      </div>
    </div>
  );
}
