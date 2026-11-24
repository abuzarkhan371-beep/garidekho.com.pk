import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CarFront, MessagesSquare, Search } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

type Participant = {
  email: string;
  profile: { firstName: string | null; lastName: string | null } | null;
};

function participantName(person: Participant) {
  return [person.profile?.firstName, person.profile?.lastName].filter(Boolean).join(" ") || person.email.split("@")[0];
}

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ started?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/messages");
  const { started } = await searchParams;

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    include: {
      listing: { select: { id: true, title: true, slug: true } },
      buyer: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
      seller: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, createdAt: true, senderId: true, isRead: true },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return (
    <div className="container-gdk py-8 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">Your inbox</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Messages</h1>
      <p className="mt-2 text-sm text-ink-500">Conversations with buyers and sellers about your listings.</p>

      {started === "1" && (
        <p role="status" className="surface-card mt-6 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-700">
          Your message was sent. This conversation is now in your inbox.
        </p>
      )}

      {conversations.length === 0 ? (
        <div className="surface-card mt-8 rounded-xl px-6 py-20 text-center">
          <MessagesSquare className="mx-auto size-12 text-ink-300" />
          <h2 className="mt-4 font-display text-xl font-bold">No conversations yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            When you message a seller, or someone replies to your ad, the conversation will appear here.
          </p>
          <Button asChild className="mt-6"><Link href="/search"><Search /> Find a vehicle</Link></Button>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {conversations.map((conversation) => {
            const other = conversation.buyerId === user.id ? conversation.seller : conversation.buyer;
            const last = conversation.messages[0];
            const unread = Boolean(last && !last.isRead && last.senderId !== user.id);

            return (
              <div key={conversation.id} className="surface-card flex min-h-20 flex-col gap-3 rounded-xl p-4 transition-colors hover:border-link sm:flex-row sm:items-center">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink-50 text-link">
                  <MessagesSquare className="size-5" />
                </div>
                <Link href={`/messages/${conversation.id}`} className="min-w-0 flex-1 rounded-lg py-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-bold hover:text-link">{participantName(other)}</p>
                    {unread && <Badge variant="signal">New</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-xs font-semibold text-link">
                    About: {conversation.listing.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-500">
                    {last ? last.body : "No messages yet — start the conversation."}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                  <span className="text-xs text-ink-400">{timeAgo(last?.createdAt ?? conversation.createdAt)}</span>
                  <Link
                    href={`/listings/${conversation.listing.slug}`}
                    className="flex min-h-10 items-center gap-1 text-xs font-bold text-link hover:underline"
                    aria-label={`View listing ${conversation.listing.title}`}
                  >
                    <CarFront className="size-3.5" /> View ad
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
