"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck, Check, Clipboard, Flag, Heart, Loader2, MessageCircle, Phone, Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/providers/toast-provider";
import { cn, formatPrice } from "@/lib/utils";

export function ListingContact({
  listingId, slug, title, price, sellerName, sellerPhone, whatsappNumber, showPhone, verified, isSaved, dealer,
}: {
  listingId: string;
  slug: string;
  title: string;
  price: number;
  sellerName: string;
  sellerPhone: string;
  whatsappNumber: string | null;
  showPhone: boolean;
  verified: boolean;
  isSaved: boolean;
  dealer: { businessName: string; slug: string } | null;
}) {
  const { toast } = useToast();
  const [saved, setSaved] = useState(isSaved);
  const [revealed, setRevealed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: `Hi, is this ${title} still available?` });
  const [report, setReport] = useState({ reason: "Misleading information", details: "" });

  async function toggleSave() {
    const response = await fetch(`/api/favourites/${listingId}`, { method: "POST" });
    if (response.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent(`/listings/${slug}`)}`;
      return;
    }
    if (response.ok) {
      const data = (await response.json()) as { saved: boolean };
      setSaved(data.saved);
      toast(data.saved ? "Added to saved vehicles" : "Removed from saved vehicles");
    }
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast("Listing link copied to clipboard");
      }
    } catch {
      toast("Could not share this listing", "error");
    }
  }

  async function submitInquiry(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    try {
      const response = await fetch(`/api/listings/${listingId}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not send your inquiry.");
      setSent(true);
      toast("Your message was sent to the seller");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not send your inquiry", "error");
    } finally {
      setSending(false);
    }
  }

  async function submitReport(event: React.FormEvent) {
    event.preventDefault();
    setReporting(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...report, listingId }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not submit report.");
      setReportOpen(false);
      toast("Report submitted. Thank you for keeping Garidekho safe.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not submit report", "error");
    } finally {
      setReporting(false);
    }
  }

  const whatsapp = (whatsappNumber || sellerPhone).replace(/[^\d]/g, "");

  return (
    <div className="space-y-3">
      <div className="surface-card rounded-xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Asking price</p>
        <p className="mt-1 font-display text-3xl font-extrabold text-cta-ink dark:text-cta">{formatPrice(price)}</p>
      </div>

      <div className="surface-card rounded-xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Seller</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-ink-950 font-display font-bold text-white dark:bg-cta">
            {sellerName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate font-bold">
              {dealer ? dealer.businessName : sellerName}
              {verified && <BadgeCheck className="size-4 shrink-0 text-cta-ink dark:text-cta" />}
            </p>
            <p className="text-xs text-ink-500">{dealer ? "Verified dealer" : "Private seller"}</p>
          </div>
        </div>

        {showPhone && sellerPhone ? (
          revealed ? (
            <a href={`tel:${sellerPhone}`} className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white hover:bg-orange-600">
              <Phone /> {sellerPhone}
            </a>
          ) : (
            <Button className="mt-4 w-full" size="lg" onClick={() => setRevealed(true)}>
              <Phone /> Show phone number
            </Button>
          )
        ) : (
          <p className="mt-4 rounded-lg bg-ink-50 p-3 text-xs text-ink-500 dark:bg-ink-800">
            The seller prefers inquiries through the form below.
          </p>
        )}

        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello, I'm interested in ${title} on Garidekho.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex h-11 items-center justify-center gap-2 rounded-xl border border-cta/30 text-sm font-bold text-cta-ink transition-colors hover:bg-cta/10 dark:border-cta/50 dark:text-cta dark:hover:bg-cta/10"
          >
            <MessageCircle /> Chat on WhatsApp
          </a>
        )}

        {dealer && (
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link href={`/dealers/${dealer.slug}`}>View dealer profile</Link>
          </Button>
        )}
      </div>

      <div className="surface-card rounded-xl p-5">
        <h3 className="font-bold">Send an inquiry</h3>
        {sent ? (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
            <Check className="mb-2 size-5" /> Your message is on its way. The seller will contact you directly.
          </div>
        ) : (
          <form onSubmit={submitInquiry} className="mt-4 space-y-3">
            <Field label="Your name" required><Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ahmed Raza" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" required><Input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="03001234567" /></Field>
              <Field label="Email" hint="Optional"><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></Field>
            </div>
            <Field label="Message" required><Textarea required rows={4} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></Field>
            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? <Loader2 className="animate-spin" /> : <MessageCircle />} Send message
            </Button>
          </form>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={toggleSave}>
          <Heart className={cn(saved && "fill-red-500 text-red-500")} /> {saved ? "Saved" : "Save"}
        </Button>
        <Button variant="outline" className="flex-1" onClick={share}><Share2 /> Share</Button>
        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
          <DialogTrigger asChild><Button variant="outline" size="icon" aria-label="Report listing"><Flag /></Button></DialogTrigger>
          <DialogContent>
            <DialogTitle>Report this listing</DialogTitle>
            <form onSubmit={submitReport} className="space-y-3">
              <Field label="Reason" required>
                <select
                  value={report.reason}
                  onChange={(event) => setReport({ ...report, reason: event.target.value })}
                  className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-900"
                >
                  <option>Misleading information</option>
                  <option>Scam or fraud</option>
                  <option>Duplicate listing</option>
                  <option>Wrong category</option>
                  <option>Prohibited content</option>
                </select>
              </Field>
              <Field label="Details" hint="Optional"><Textarea rows={4} value={report.details} onChange={(event) => setReport({ ...report, details: event.target.value })} /></Field>
              <Button type="submit" className="w-full" disabled={reporting}>
                {reporting ? <Loader2 className="animate-spin" /> : <Flag />} Submit report
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
            toast("Listing link copied");
          } catch {
            toast("Could not copy link", "error");
          }
        }}
        className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold text-ink-400 transition-colors hover:bg-ink-50 hover:text-link dark:hover:bg-ink-800"
      >
        <Clipboard className="size-3.5" /> Copy listing link
      </button>
    </div>
  );
}
