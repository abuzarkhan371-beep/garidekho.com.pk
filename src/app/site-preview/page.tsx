import type { Metadata } from "next";
import { DEFAULT_CUSTOMIZER_CONFIG } from "@/lib/customizer/config";
import {
  buildThemeVariables,
  decodePreviewConfig,
  getCustomFontLinks,
  variablesToCss,
} from "@/lib/customizer/theme";
import { SitePreview } from "@/components/customizer/site-preview";

export const metadata: Metadata = { title: "Site preview", robots: { index: false, follow: false } };

export default async function SitePreviewPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const config = decodePreviewConfig(c) ?? DEFAULT_CUSTOMIZER_CONFIG;
  const css = `${variablesToCss(buildThemeVariables(config), true)}
    body:has(#site-preview-root) > header,
    body:has(#site-preview-root) > footer { display: none !important; }
    body:has(#site-preview-root) { background: ${config.colors.background} !important; }
  `;

  return (
    <>
      {getCustomFontLinks(config).map((href) => <link key={href} rel="stylesheet" href={href} />)}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div id="site-preview-root">
        <SitePreview config={config} />
      </div>
    </>
  );
}
