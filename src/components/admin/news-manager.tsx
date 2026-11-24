"use client";

import { useEffect, useState, useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  deleteNewsArticleAction,
  saveNewsArticleAction,
} from "@/app/admin/content/actions";
import { initialContentActionState, type ContentActionState } from "@/lib/admin-content";

export type NewsOption = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverUrl: string | null;
  category: string | null;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  status: string;
  publishedAt: string | null;
};

export function NewsManager({ articles }: { articles: NewsOption[] }) {
  const [editing, setEditing] = useState<NewsOption | null>(null);
  const [state, action, pending] = useActionState(saveNewsArticleAction, initialContentActionState);
  const [deleteState, deleteAction] = useActionState(
    async (_prev: ContentActionState, formData: FormData) => deleteNewsArticleAction(formData),
    initialContentActionState,
  );

  useEffect(() => {
    if (state.ok) setEditing(null);
  }, [state.ok, state.message]);

  return (
    <div className="space-y-6">
      <div className="surface-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-extrabold">
              {editing ? `Edit “${editing.title}”` : "Add a news article"}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Upload a cover photo, write the story and publish it to the homepage news section.
            </p>
          </div>
          {editing && (
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>
              <X className="size-4" /> Cancel edit
            </Button>
          )}
        </div>

        <form action={action} key={editing?.id ?? "new"} className="mt-5 space-y-4">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          {state.message && (
            <p
              role="status"
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                state.ok
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              }`}
            >
              {state.message}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold">Headline</span>
              <Input name="title" required minLength={8} maxLength={180} defaultValue={editing?.title} placeholder="New SUV launches in Pakistan" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">URL slug (optional)</span>
              <Input name="slug" defaultValue={editing?.slug} placeholder="auto-generated-from-headline" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Category</span>
              <Input name="category" defaultValue={editing?.category ?? ""} placeholder="Launches" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Tags (comma separated)</span>
              <Input name="tags" defaultValue={editing?.tags.join(", ") ?? ""} placeholder="EV, Toyota, launches" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Status</span>
              <select name="status" className="flex h-11 w-full rounded-xl border border-ink-100 bg-white px-3.5 text-sm dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50" defaultValue={editing?.status ?? "DRAFT"}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold">Excerpt</span>
            <Textarea name="excerpt" required minLength={20} maxLength={500} defaultValue={editing?.excerpt} placeholder="A short summary shown on news cards…" />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold">Article body</span>
            <Textarea name="content" required minLength={40} maxLength={30000} defaultValue={editing?.content} placeholder="Write the full story…" className="min-h-56" />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Cover photo URL</span>
              <Input name="coverUrl" defaultValue={editing?.coverUrl ?? ""} placeholder="https://…" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Upload cover photo</span>
              <Input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="h-auto py-2" />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">SEO title</span>
              <Input name="seoTitle" defaultValue={editing?.seoTitle ?? ""} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">SEO description</span>
              <Input name="seoDescription" defaultValue={editing?.seoDescription ?? ""} />
            </label>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : editing ? "Save article" : "Add news article"}
          </Button>
        </form>
      </div>

      <div className="surface-card overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-5 py-4 dark:border-ink-800">
          <h2 className="font-display text-lg font-bold">Articles ({articles.length})</h2>
          {deleteState.message && (
            <p role="status" className="text-sm font-semibold text-ink-600 dark:text-ink-300">
              {deleteState.message}
            </p>
          )}
        </div>
        <div className="divide-y divide-ink-100 dark:divide-ink-800">
          {articles.map((article) => (
            <div key={article.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                {article.coverUrl ? <Image src={article.coverUrl} alt="" fill sizes="64px" className="object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-bold">{article.title}</p>
                  <Badge variant={article.status === "PUBLISHED" ? "signal" : "outline"}>{article.status.toLowerCase()}</Badge>
                </div>
                <p className="mt-1 truncate text-xs text-ink-500">
                  /news/{article.slug} · {article.category || "Uncategorised"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {article.status === "PUBLISHED" && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/news/${article.slug}`}>View</Link>
                  </Button>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(article)}>
                  <Pencil className="size-4" /> Edit
                </Button>
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={article.id} />
                  <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="size-4" /> Delete
                  </Button>
                </form>
              </div>
            </div>
          ))}
          {articles.length === 0 && (
            <p className="px-5 py-12 text-center text-sm text-ink-500">No articles yet. Add the first one above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
