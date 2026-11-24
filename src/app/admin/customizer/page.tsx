import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { getSiteCustomizer } from "@/lib/customizer/server";
import { CustomizerEditor } from "@/components/admin/customizer-editor";

export const metadata: Metadata = { title: "Site Customizer", robots: { index: false, follow: false } };

export default async function AdminCustomizerPage() {
  const [admin, config] = await Promise.all([getSessionUser(), getSiteCustomizer()]);
  if (!admin || !hasPermission(admin, "settings.manage")) redirect("/admin");

  return <CustomizerEditor initialConfig={config} canManage />;
}
