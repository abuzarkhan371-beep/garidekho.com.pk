import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { ReportControls } from "@/components/admin/report-controls";

export const metadata: Metadata = { title: "Reported listings", robots: { index: false, follow: false } };

const REPORT_LABELS: Record<string, string> = {
  OPEN: "Open", IN_REVIEW: "In review", RESOLVED: "Resolved", DISMISSED: "Dismissed",
};

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    include: {
      listing: { select: { id: true, title: true, slug: true } },
      reporter: { select: { email: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const handlerIds = [...new Set(reports.map((report) => report.handledById).filter((id): id is string => Boolean(id)))];
  const handlers = handlerIds.length
    ? await prisma.user.findMany({ where: { id: { in: handlerIds } }, select: { id: true, email: true } })
    : [];
  const handlerEmails = new Map(handlers.map((item) => [item.id, item.email]));

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Reports</h1>
      <p className="mt-1 text-sm text-ink-500">Review community reports and record the outcome.</p>

      <div className="mt-6 space-y-3">
        {reports.length === 0 ? (
          <div className="surface-card rounded-xl px-6 py-20 text-center">
            <Flag className="mx-auto size-10 text-ink-300" />
            <p className="mt-3 font-bold">No reports have been filed.</p>
          </div>
        ) : (
          reports.map((report) => (
            <article key={report.id} className="surface-card rounded-xl p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={report.status === "RESOLVED" ? "success" : report.status === "DISMISSED" ? "neutral" : "danger"}>
                  {REPORT_LABELS[report.status] ?? report.status}
                </Badge>
                <span className="text-xs text-ink-500">{new Date(report.createdAt).toLocaleString("en-PK")}</span>
              </div>
              <h2 className="mt-2 font-display text-lg font-bold">{report.reason}</h2>
              {report.details && <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{report.details}</p>}
              <p className="mt-2 text-xs text-ink-500">
                {report.listing ? (
                  <Link href={`/listings/${report.listing.slug}`} className="font-semibold text-link hover:underline dark:text-link-soft">
                    {report.listing.title}
                  </Link>
                ) : (
                  "General report"
                )}
                {" · Reported by "}{report.reporter?.email ?? "guest"}
                {report.handledById ? ` · Handled by ${handlerEmails.get(report.handledById) ?? "admin"}` : ""}
              </p>
              {report.resolution && (
                <p className="mt-2 rounded-lg bg-ink-50 p-3 text-sm dark:bg-ink-800"><strong>Resolution:</strong> {report.resolution}</p>
              )}
              {report.status !== "RESOLVED" && report.status !== "DISMISSED" && <ReportControls reportId={report.id} />}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
