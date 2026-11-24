import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, CarFront, MessagesSquare, Send } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Conversation",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
};

type Participant = {
  email: string;
  profile: { firstName: string | null; lastName: string | null } | null;
};

function participantName(person: Participant) {
  return [person.profile?.firstName, person.profile?.lastName].filter(Boolean).join(" ") || person.email.split("@")[0];
}

const participantSelect = {
  id: true,
  email: true,
  profile: { select: { firstName: true, lastName: true } },
} as const;

export default async function ConversationPage({ params, searchParams }: Props) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/messages");

  const { id } = await params;
  const { sent, error } = await searchParams;

  const conversation = await prisma.conversation.findFirst({
    where: { id, OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    include: {
      listing: { select: { id: true, title: true, slug: true, price: true } },
      buyer: { select: participantSelect },
      seller: { select: participantSelect },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: participantSelect } },
      },
    },
  });
  if (!conversation) notFound();
  const conversationId = conversation.id;
  const buyerId = conversation.buyerId;
  const sellerId = conversation.sellerId;

  async function reply(formData: FormData) {
    "use server";

    const current = await getSessionUser();
    if (!current) redirect(`/login?next=/messages/${id}`);
    if (current.id !== buyerId && current.id !== sellerId) notFound();

    const body = String(formData.get("body") ?? "").trim();
    if (body.length < 2 || body.length > 2000) {
      redirect(`/messages/${id}?error=Enter+a+reply+between+2+and+2000+characters`);
    }

    await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: id,
          senderId: current.id,
          senderType: current.roleName === "DEALER" ? "DEALER" : "USER",
          body,
        },
      }),
      prisma.message.updateMany({
        where: { conversationId: id, senderId: { not: current.id }, isRead: false },
        data: { isRead: true },
      }),
      // The schema tracks conversation activity with lastMessageAt, not updatedAt.
      prisma.conversation.update({ where: { id }, data: { lastMessageAt: new Date() } }),
    ]);

    revalidatePath(`/messages/${id}`);
    revalidatePath("/messages");
    redirect(`/messages/${id}?sent=1`);
  }

  const other = conversation.buyerId === user.id ? conversation.seller : conversation.buyer;

  return (
    <div className="container-gdk max-w-4xl py-8 lg:py-12">
      <Link href="/messages" className="flex min-h-10 items-center gap-1.5 text-sm font-bold text-link hover:underline">
        <ArrowLeft className="size-4" /> Back to messages
      </Link>

      <div className="surface-card mt-5 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">Conversation</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">{participantName(other)}</h1>
          </div>
          <Link
            href={`/listings/${conversation.listing.slug}`}
            className="flex min-h-10 items-center gap-2 rounded-lg text-sm font-bold text-link hover:underline"
          >
            <CarFront className="size-4" />
            <span className="max-w-56 truncate">{conversation.listing.title}</span>
          </Link>
        </div>
        <p className="mt-3 text-sm text-ink-500">
          Regarding listing · started {timeAgo(conversation.createdAt)}
        </p>
      </div>

      {sent === "1" && (
        <p role="status" className="surface-card mt-4 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-700">
          Your reply was sent.
        </p>
      )}
      {error && (
        <p role="alert" className="surface-card mt-4 rounded-xl px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <section aria-label="Messages" className="surface-card mt-5 rounded-xl p-4 sm:p-6">
        {conversation.messages.length === 0 ? (
          <div className="py-14 text-center">
            <MessagesSquare className="mx-auto size-11 text-ink-300" />
            <h2 className="mt-4 font-display text-lg font-bold">No messages in this conversation yet</h2>
            <p className="mt-1 text-sm text-ink-500">Send the first reply below.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversation.messages.map((message) => {
              const mine = message.senderId === user.id;
              const senderName = message.sender
                ? participantName(message.sender)
                : message.senderType === "SYSTEM"
                  ? "Garidekho"
                  : "Former member";

              return (
                <div key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${mine ? "bg-link-ink text-white" : "bg-ink-50 text-ink-900"}`}>
                    <p className={`text-[0.7rem] font-bold ${mine ? "text-blue-100" : "text-link"}`}>{senderName}</p>
                    <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed">{message.body}</p>
                    <p className={`mt-1.5 text-[0.68rem] ${mine ? "text-blue-100" : "text-ink-500"}`}>
                      {timeAgo(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <form action={reply} className="surface-card mt-5 space-y-3 rounded-xl p-5 sm:p-6">
        <Label htmlFor="reply-body">Your reply</Label>
        <Textarea
          id="reply-body"
          name="body"
          required
          minLength={2}
          maxLength={2000}
          rows={4}
          placeholder={`Write a message to ${participantName(other)}…`}
        />
        <div className="flex justify-end">
          <Button type="submit"><Send /> Send reply</Button>
        </div>
      </form>
    </div>
  );
}
