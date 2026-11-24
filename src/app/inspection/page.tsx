import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, FileSearch, Gauge, MessageCircle, ShieldCheck, Wrench } from "lucide-react";
import { prisma } from "@/lib/db";
import { InspectionForm } from "@/components/content/inspection-form";
import { PageHero, ContentSection } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "Vehicle Inspection Service — check before you buy",
  description: "Request an independent vehicle inspection in Pakistan. See what our inspectors check, how to request one, and how inspection fits into a safe purchase on Garidekho.",
  alternates: { canonical: "/inspection" },
};

const checks = [
  { icon: FileSearch, title: "Documents & identity", text: "Registration book, CNIC of the seller, chassis and engine number matching, transfer path and any loan or court restrictions." },
  { icon: Wrench, title: "Engine & transmission", text: "Cold start, unusual noises, leaks, gear changes, clutch behaviour, cooling system and service history evidence." },
  { icon: Gauge, title: "Mileage & mechanicals", text: "Odometer consistency, brakes, suspension, steering, tyres, battery, air conditioning and electrical systems." },
  { icon: ShieldCheck, title: "Body & accident history", text: "Panel gaps, paint thickness indicators where available, signs of flood damage, welding or structural repairs." },
  { icon: ClipboardCheck, title: "Road test", text: "Acceleration, braking, vibration, steering alignment and behaviour on both city roads and higher speeds where safe." },
  { icon: MessageCircle, title: "Written summary", text: "A plain-language report of findings and recommended follow-up work, shared with the requester." },
];

export default async function InspectionPage() {
  const cities = await prisma.city.findMany({
    where: { isMajor: true },
    select: { name: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHero
        eyebrow="Inspection service"
        title="Know the vehicle before you pay for it"
        description="A listing tells you what a seller claims. An inspection tells you what the vehicle actually is. Request a check with the vehicle details and city, and our team will follow up with next steps."
        breadcrumb={[{ label: "Inspection", href: "/inspection" }]}
      />

      <div className="container-gdk space-y-12 py-10 lg:py-14">
        <ContentSection title="What we check">
          <div className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            {checks.map(({ icon: Icon, title, text }) => (
              <div key={title} className="surface-card rounded-xl p-5">
                <Icon className="size-5 text-link" />
                <h3 className="mt-3 text-sm font-bold text-ink-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-600 dark:text-ink-300">{text}</p>
              </div>
            ))}
          </div>
        </ContentSection>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-8">
            <ContentSection title="How the request works">
              <ol className="list-decimal space-y-2 pl-5">
                <li>Send us the vehicle make, model, year and city using the form.</li>
                <li>Add the listing URL or seller details if you already have a specific vehicle in mind.</li>
                <li>We record your request and contact you on the phone number you provided to confirm timing and scope.</li>
                <li>The inspection is carried out and findings are shared with you before you decide whether to proceed.</li>
              </ol>
              <p className="text-xs text-ink-500">
                Submitting the form does not guarantee an available inspector on a particular date. We will confirm the
                schedule and any applicable fee before the appointment.
              </p>
            </ContentSection>

            <ContentSection title="Use inspection alongside other tools">
              <p>
                Start with the <Link href="/estimate" className="font-semibold text-link hover:underline dark:text-link-soft">market estimate</Link> to understand
                whether the asking price makes sense, read <Link href="/verification" className="font-semibold text-link hover:underline dark:text-link-soft">what our verification badges mean</Link>,
                and follow the <Link href="/guides/sell-car-fast-safely-pakistan" className="font-semibold text-link hover:underline dark:text-link-soft">selling and buying guide</Link> for paperwork.
              </p>
              <p>
                An inspection is not a warranty. It reports the condition observed on the day of the check; hidden faults
                and later damage remain possible.
              </p>
            </ContentSection>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold">Request an inspection</h2>
            <p className="mt-1 text-sm text-ink-500">Your request is saved in our support system.</p>
            <div className="mt-4"><InspectionForm cities={cities.map((city) => city.name)} /></div>
          </div>
        </div>
      </div>
    </>
  );
}
