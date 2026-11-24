"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "idle" | "submitting" | "success" | "error";

export function InspectionForm({ cities }: { cities: string[] }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/inspection-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          phone: String(data.get("phone") ?? ""),
          city: String(data.get("city") ?? ""),
          vehicle: String(data.get("vehicle") ?? ""),
          notes: String(data.get("notes") ?? ""),
        }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not submit your request. Please try again.");
      setStatus("success");
      setMessage(payload.message ?? "Your request has been recorded.");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not submit your request. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="surface-card rounded-xl p-6" role="status">
        <CheckCircle2 className="size-8 text-link" />
        <h2 className="mt-3 font-display text-lg font-bold">Request received</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{message}</p>
        <Button variant="outline" className="mt-5" onClick={() => setStatus("idle")}>Send another request</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card space-y-4 rounded-xl p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="inspection-name">Full name *</Label>
          <Input id="inspection-name" name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Your name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inspection-phone">Phone / WhatsApp *</Label>
          <Input id="inspection-phone" name="phone" required type="tel" autoComplete="tel" placeholder="+92 3xx xxxxxxx" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="inspection-email">Email *</Label>
          <Input id="inspection-email" name="email" required type="email" autoComplete="email" placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inspection-city">City *</Label>
          <Input id="inspection-city" name="city" required maxLength={80} list="inspection-cities" placeholder="e.g. Lahore" />
          <datalist id="inspection-cities">
            {cities.map((city) => <option key={city} value={city} />)}
          </datalist>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inspection-vehicle">Vehicle to inspect *</Label>
        <Input id="inspection-vehicle" name="vehicle" required minLength={3} maxLength={160} placeholder="e.g. Toyota Corolla Altis 2021" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inspection-notes">Anything we should know?</Label>
        <Textarea id="inspection-notes" name="notes" maxLength={2000} rows={4} placeholder="Seller name, listing link, preferred time..." />
      </div>

      {status === "error" && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" role="alert">
          {message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <><Loader2 className="animate-spin" /> Sending…</> : "Request an inspection"}
      </Button>
      <p className="text-xs leading-relaxed text-ink-500">
        We store your request in our support system and use the contact details you provide only to respond to this inquiry.
      </p>
    </form>
  );
}
