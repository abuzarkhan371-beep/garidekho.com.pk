import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/services/mail";
import { SITE_URL } from "@/lib/constants";

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().min(5).max(200).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"),
  phone: z.string().trim().min(7).max(30),
  city: z.string().trim().min(2).max(80),
  vehicle: z.string().trim().min(3).max(160),
  notes: z.string().trim().max(2000).optional().default(""),
});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the required fields and try again." },
      { status: 400 },
    );
  }

  const inquiry = parsed.data;
  const details = JSON.stringify({
    type: "VEHICLE_INSPECTION",
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    city: inquiry.city,
    vehicle: inquiry.vehicle,
    notes: inquiry.notes,
    source: `${SITE_URL}/inspection`,
  });

  try {
    await prisma.report.create({
      data: {
        reason: "INSPECTION_REQUEST",
        details,
        status: "OPEN",
      },
    });
  } catch (error) {
    console.error("Failed to store inspection inquiry", error);
    return NextResponse.json({ error: "We could not save your request. Please email support instead." }, { status: 500 });
  }

  // Notification email is best-effort: the request is already safely recorded in the DB.
  const supportEmail = process.env.SUPPORT_EMAIL ?? process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@garidekho.com.pk";
  try {
    await sendEmail(
      supportEmail,
      "New vehicle inspection request",
      `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px">
        <h2 style="color:#122534">Inspection request</h2>
        <p><strong>Name:</strong> ${escapeHtml(inquiry.name)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(inquiry.phone)}</p>
        <p><strong>Email:</strong> ${escapeHtml(inquiry.email)}</p>
        <p><strong>City:</strong> ${escapeHtml(inquiry.city)}</p>
        <p><strong>Vehicle:</strong> ${escapeHtml(inquiry.vehicle)}</p>
        <p><strong>Notes:</strong> ${escapeHtml(inquiry.notes || "—")}</p>
      </div>`,
    );
  } catch (error) {
    console.error("Inspection notification email failed", error);
  }

  return NextResponse.json({ message: "Thanks — your inspection request has been recorded. Our team will contact you on the phone number you provided." }, { status: 201 });
}
