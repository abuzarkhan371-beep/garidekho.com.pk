"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText, ImagePlus, Loader2, Monitor, Palette, RotateCcw, Save,
  Settings2, Smartphone, Tablet, Trash2, Type,
} from "lucide-react";
import { saveSiteCustomizerAction, uploadCustomizerAssetAction } from "@/app/admin/customizer/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/providers/toast-provider";
import {
  DEFAULT_CUSTOMIZER_CONFIG,
  FONT_OPTIONS,
  type SiteCustomizerConfig,
} from "@/lib/customizer/config";
import { encodePreviewConfig } from "@/lib/customizer/theme";
import { cn } from "@/lib/utils";

type Tab = "theme" | "typography" | "content" | "media" | "settings";
type Device = "desktop" | "tablet" | "mobile";
type UploadSlot = "logo" | "favicon" | "heroBanner" | "promo1" | "promo2" | "promo3";

const TABS: { id: Tab; label: string; icon: typeof Palette }[] = [
  { id: "theme", label: "Theme", icon: Palette },
  { id: "typography", label: "Fonts", icon: Type },
  { id: "content", label: "Content", icon: FileText },
  { id: "media", label: "Media", icon: ImagePlus },
  { id: "settings", label: "Settings", icon: Settings2 },
];

const DEVICES: { id: Device; label: string; icon: typeof Monitor; width: string }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "768px" },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: "390px" },
];

function normalizeConfig(config: SiteCustomizerConfig): SiteCustomizerConfig {
  return {
    ...config,
    media: {
      ...config.media,
      promoBanners: [0, 1, 2].map((index) =>
        config.media.promoBanners[index] ?? { url: "", href: "", alt: "" },
      ),
    },
    settings: {
      announcement: { ...DEFAULT_CUSTOMIZER_CONFIG.settings.announcement, ...config.settings?.announcement },
      maintenance: { ...DEFAULT_CUSTOMIZER_CONFIG.settings.maintenance, ...config.settings?.maintenance },
      moderation: { ...DEFAULT_CUSTOMIZER_CONFIG.settings.moderation, ...config.settings?.moderation },
    },
  };
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const valid = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={valid ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
          className="size-9 cursor-pointer rounded-lg border border-ink-200 bg-transparent p-0.5 dark:border-ink-700"
          aria-label={`${label} colour picker`}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={7}
          className="w-24 font-mono text-xs uppercase"
          aria-label={`${label} hex value`}
        />
      </span>
    </label>
  );
}

function TextField({
  label, value, onChange, multiline, hint, maxLength = 300, placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {multiline ? (
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          maxLength={maxLength}
          placeholder={placeholder}
        />
      ) : (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
        />
      )}
      {hint && <span className="text-[0.68rem] text-ink-400">{hint}</span>}
    </label>
  );
}

function Uploader({
  id, label, value, uploading, onFile, onRemove,
}: {
  id: UploadSlot;
  label: string;
  value: string;
  uploading: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-ink-100 p-3 dark:border-ink-800">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{label}</p>
        {value && (
          <button
            type="button"
            onClick={onRemove}
            className="flex size-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
            aria-label={`Remove ${label}`}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-100 dark:bg-ink-800">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-5 text-ink-400" />
          )}
        </div>
        <label
          htmlFor={`upload-${id}`}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-ink-300 px-3 py-2 text-xs font-semibold text-ink-500 transition-colors hover:border-link hover:text-link dark:border-ink-700"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {uploading ? "Uploading…" : "Choose image"}
          <input
            id={`upload-${id}`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}

export function CustomizerEditor({
  initialConfig,
  canManage,
}: {
  initialConfig: SiteCustomizerConfig;
  canManage: boolean;
}) {
  const { toast } = useToast();
  const startingConfig = useMemo(() => normalizeConfig(initialConfig), [initialConfig]);
  const [config, setConfig] = useState<SiteCustomizerConfig>(startingConfig);
  const [baseline, setBaseline] = useState(() => JSON.stringify(startingConfig));
  const [tab, setTab] = useState<Tab>("theme");
  const [device, setDevice] = useState<Device>("desktop");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<UploadSlot | null>(null);

  const encoded = useMemo(() => encodePreviewConfig(config), [config]);
  const [previewUrl, setPreviewUrl] = useState(() => `/site-preview?c=${encodePreviewConfig(startingConfig)}`);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreviewUrl(`/site-preview?c=${encoded}&v=${Date.now()}`);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [encoded]);

  const dirty = JSON.stringify(config) !== baseline;

  function patchColors(key: keyof SiteCustomizerConfig["colors"], value: string) {
    setConfig((current) => ({ ...current, colors: { ...current.colors, [key]: value } }));
  }
  function patchFonts(key: keyof SiteCustomizerConfig["fonts"], value: string | number) {
    setConfig((current) => ({ ...current, fonts: { ...current.fonts, [key]: value } }));
  }
  function patchContent(key: keyof SiteCustomizerConfig["content"], value: string) {
    setConfig((current) => ({ ...current, content: { ...current.content, [key]: value } }));
  }
  function patchMedia(key: "logo" | "favicon" | "heroBanner", value: string) {
    setConfig((current) => ({ ...current, media: { ...current.media, [key]: value } }));
  }
  function patchPromo(index: number, key: "url" | "href" | "alt", value: string) {
    setConfig((current) => ({
      ...current,
      media: {
        ...current.media,
        promoBanners: current.media.promoBanners.map((banner, position) =>
          position === index ? { ...banner, [key]: value } : banner,
        ),
      },
    }));
  }
  function patchAnnouncement(key: keyof SiteCustomizerConfig["settings"]["announcement"], value: string | boolean) {
    setConfig((current) => ({
      ...current,
      settings: {
        ...current.settings,
        announcement: { ...current.settings.announcement, [key]: value },
      },
    }));
  }
  function patchMaintenance(key: keyof SiteCustomizerConfig["settings"]["maintenance"], value: string | boolean) {
    setConfig((current) => ({
      ...current,
      settings: {
        ...current.settings,
        maintenance: { ...current.settings.maintenance, [key]: value },
      },
    }));
  }

  async function handleSave() {
    if (!canManage) return;
    setSaving(true);
    const next = { ...config, publishedAt: new Date().toISOString() };
    const result = await saveSiteCustomizerAction(next);
    toast(result.message, result.ok ? "success" : "error");
    if (result.ok) {
      setConfig(next);
      setBaseline(JSON.stringify(next));
    }
    setSaving(false);
  }

  async function handleUpload(slot: UploadSlot, file: File) {
    setUploading(slot);
    const formData = new FormData();
    formData.set("slot", slot);
    formData.set("file", file);
    const result = await uploadCustomizerAssetAction(formData);
    if (result.ok && result.url) {
      if (slot === "logo" || slot === "favicon" || slot === "heroBanner") patchMedia(slot, result.url);
      else patchPromo(Number(slot.slice(-1)) - 1, "url", result.url);
    }
    toast(result.message, result.ok ? "success" : "error");
    setUploading(null);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Site Customizer</h1>
          <p className="mt-1 text-sm text-ink-500">
            Edit colours, fonts, copy and branding. Preview everything before publishing to the live site.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={dirty ? "signal" : "success"}>
            {dirty ? "Unsaved changes" : "All changes published"}
          </Badge>
          {!canManage && <Badge variant="neutral">Read only</Badge>}
          <Button
            variant="outline"
            onClick={() => setConfig(normalizeConfig(DEFAULT_CUSTOMIZER_CONFIG))}
            disabled={!dirty || saving || !canManage}
          >
            <RotateCcw /> Reset all
          </Button>
          <Button onClick={handleSave} disabled={!dirty || saving || !canManage}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Save &amp; Publish
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
        <aside className="surface-card self-start rounded-xl xl:sticky xl:top-6 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
          <div className="grid grid-cols-4 gap-1 border-b border-ink-100 p-3 dark:border-ink-800">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[0.68rem] font-bold transition-colors",
                  tab === id
                    ? "bg-link-ink text-white"
                    : "text-ink-500 hover:bg-ink-50 dark:text-ink-400 dark:hover:bg-ink-800",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-5 p-4">
            {tab === "theme" && (
              <>
                <div>
                  <p className="font-display text-sm font-bold">Brand colours</p>
                  <p className="mt-0.5 text-xs text-ink-400">Pick exact hex values or use the colour swatches.</p>
                </div>
                <div className="space-y-3">
                  <ColorField label="Primary (buttons)" value={config.colors.primary} onChange={(v) => patchColors("primary", v)} />
                  <ColorField label="Secondary (dark areas)" value={config.colors.secondary} onChange={(v) => patchColors("secondary", v)} />
                  <ColorField label="Accent (badges)" value={config.colors.accent} onChange={(v) => patchColors("accent", v)} />
                  <ColorField label="Page background" value={config.colors.background} onChange={(v) => patchColors("background", v)} />
                  <ColorField label="Card surface" value={config.colors.surface} onChange={(v) => patchColors("surface", v)} />
                  <ColorField label="Header" value={config.colors.header} onChange={(v) => patchColors("header", v)} />
                  <ColorField label="Footer" value={config.colors.footer} onChange={(v) => patchColors("footer", v)} />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setConfig((current) => ({ ...current, colors: DEFAULT_CUSTOMIZER_CONFIG.colors }))}
                  disabled={!canManage}
                >
                  <RotateCcw /> Reset colours to default
                </Button>
              </>
            )}

            {tab === "typography" && (
              <>
                <div>
                  <p className="font-display text-sm font-bold">Typography</p>
                  <p className="mt-0.5 text-xs text-ink-400">Google Fonts load automatically when selected.</p>
                </div>
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium">Heading font (H1–H6)</span>
                  <select
                    value={config.fonts.heading}
                    onChange={(event) => patchFonts("heading", event.target.value)}
                    className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm font-medium dark:border-ink-700 dark:bg-ink-900"
                  >
                    {FONT_OPTIONS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium">Body font</span>
                  <select
                    value={config.fonts.body}
                    onChange={(event) => patchFonts("body", event.target.value)}
                    className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm font-medium dark:border-ink-700 dark:bg-ink-900"
                  >
                    {FONT_OPTIONS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="flex items-center justify-between text-sm font-medium">
                    Base font size <span className="text-link">{config.fonts.baseSize}px</span>
                  </span>
                  <input
                    type="range"
                    min={14}
                    max={20}
                    step={1}
                    value={config.fonts.baseSize}
                    onChange={(event) => patchFonts("baseSize", Number(event.target.value))}
                    className="accent-link"
                  />
                </label>
                <div
                  className="rounded-xl border border-ink-100 p-4 dark:border-ink-800"
                  style={{ fontFamily: `"${config.fonts.body}", sans-serif`, fontSize: config.fonts.baseSize }}
                >
                  <p className="font-bold" style={{ fontFamily: `"${config.fonts.heading}", sans-serif` }}>
                    Heading sample — Find your next car
                  </p>
                  <p className="mt-2 text-sm text-ink-500">
                    Body sample — browse verified cars, bikes and auto parts across Pakistan.
                  </p>
                </div>
              </>
            )}

            {tab === "content" && (
              <>
                <div>
                  <p className="font-display text-sm font-bold">Website copy</p>
                  <p className="mt-0.5 text-xs text-ink-400">Use {"{{year}}"} anywhere to insert the current year.</p>
                </div>
                <div className="space-y-4">
                  <TextField label="Site name" value={config.content.siteName} onChange={(v) => patchContent("siteName", v)} maxLength={60} />
                  <TextField label="Hero title" value={config.content.heroTitle} onChange={(v) => patchContent("heroTitle", v)} maxLength={160} />
                  <TextField label="Hero highlighted text" value={config.content.heroAccent} onChange={(v) => patchContent("heroAccent", v)} maxLength={160} />
                  <TextField label="Hero subtitle" value={config.content.heroSubtitle} onChange={(v) => patchContent("heroSubtitle", v)} multiline maxLength={600} />
                  <TextField label="Search bar placeholder" value={config.content.searchPlaceholder} onChange={(v) => patchContent("searchPlaceholder", v)} maxLength={160} />
                  <TextField label="Search button text" value={config.content.searchButton} onChange={(v) => patchContent("searchButton", v)} maxLength={60} />
                  <TextField label="Main CTA title" value={config.content.ctaTitle} onChange={(v) => patchContent("ctaTitle", v)} maxLength={120} />
                  <TextField label="Main CTA text" value={config.content.ctaText} onChange={(v) => patchContent("ctaText", v)} multiline maxLength={600} />
                  <TextField label="CTA button text" value={config.content.ctaButton} onChange={(v) => patchContent("ctaButton", v)} maxLength={60} />
                  <TextField label="About section title" value={config.content.aboutTitle} onChange={(v) => patchContent("aboutTitle", v)} maxLength={160} />
                  <TextField label="About section text" value={config.content.aboutText} onChange={(v) => patchContent("aboutText", v)} multiline maxLength={1200} />
                  <TextField label="Footer description" value={config.content.footerAbout} onChange={(v) => patchContent("footerAbout", v)} multiline maxLength={600} />
                  <TextField label="Footer copyright" value={config.content.copyright} onChange={(v) => patchContent("copyright", v)} maxLength={200} />
                  <TextField label="Contact address" value={config.content.contactAddress} onChange={(v) => patchContent("contactAddress", v)} maxLength={200} />
                  <TextField label="Contact phone" value={config.content.contactPhone} onChange={(v) => patchContent("contactPhone", v)} maxLength={60} />
                  <TextField label="Contact email" value={config.content.contactEmail} onChange={(v) => patchContent("contactEmail", v)} maxLength={120} />
                </div>
              </>
            )}

            {tab === "media" && (
              <>
                <div>
                  <p className="font-display text-sm font-bold">Branding &amp; media</p>
                  <p className="mt-0.5 text-xs text-ink-400">Uploads are optimised and staged until you publish.</p>
                </div>
                <div className="space-y-3">
                  <Uploader
                    id="logo" label="Website logo" value={config.media.logo}
                    uploading={uploading === "logo"} onFile={(file) => handleUpload("logo", file)}
                    onRemove={() => patchMedia("logo", "")}
                  />
                  <Uploader
                    id="favicon" label="Favicon" value={config.media.favicon}
                    uploading={uploading === "favicon"} onFile={(file) => handleUpload("favicon", file)}
                    onRemove={() => patchMedia("favicon", "")}
                  />
                  <Uploader
                    id="heroBanner" label="Hero banner" value={config.media.heroBanner}
                    uploading={uploading === "heroBanner"} onFile={(file) => handleUpload("heroBanner", file)}
                    onRemove={() => patchMedia("heroBanner", "")}
                  />
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="space-y-2 rounded-xl border border-ink-100 p-3 dark:border-ink-800">
                      <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Promotional banner {index + 1}</p>
                      <Uploader
                        id={`promo${index + 1}` as UploadSlot}
                        label={`Banner image ${index + 1}`}
                        value={config.media.promoBanners[index]?.url ?? ""}
                        uploading={uploading === `promo${index + 1}`}
                        onFile={(file) => handleUpload(`promo${index + 1}` as UploadSlot, file)}
                        onRemove={() => patchPromo(index, "url", "")}
                      />
                      <Input
                        value={config.media.promoBanners[index]?.alt ?? ""}
                        onChange={(event) => patchPromo(index, "alt", event.target.value)}
                        placeholder="Banner caption / alt text"
                        maxLength={200}
                      />
                      <Input
                        value={config.media.promoBanners[index]?.href ?? ""}
                        onChange={(event) => patchPromo(index, "href", event.target.value)}
                        placeholder="Link (e.g. /search?sort=newest)"
                        maxLength={500}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "settings" && (
              <>
                <div>
                  <p className="font-display text-sm font-bold">Site settings</p>
                  <p className="mt-0.5 text-xs text-ink-400">Announcements and maintenance are live as soon as you publish.</p>
                </div>

                <div className="space-y-3 rounded-xl border border-ink-100 p-3 dark:border-ink-800">
                  <label className="flex items-center justify-between gap-3">
                    <span>
                      <span className="block text-sm font-semibold">Announcement bar</span>
                      <span className="block text-xs text-ink-400">Shown above the header on every public page.</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={config.settings.announcement.enabled}
                      onChange={(event) => patchAnnouncement("enabled", event.target.checked)}
                      className="size-4 accent-link"
                    />
                  </label>
                  {config.settings.announcement.enabled && (
                    <>
                      <TextField
                        label="Announcement text"
                        value={config.settings.announcement.text}
                        onChange={(value) => patchAnnouncement("text", value)}
                        maxLength={240}
                      />
                      <TextField
                        label="Link (optional)"
                        value={config.settings.announcement.href}
                        onChange={(value) => patchAnnouncement("href", value)}
                        placeholder="/search?sort=newest or https://…"
                        maxLength={500}
                      />
                      <label className="grid gap-1.5">
                        <span className="text-sm font-medium">Tone</span>
                        <select
                          value={config.settings.announcement.tone}
                          onChange={(event) => patchAnnouncement("tone", event.target.value)}
                          className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm font-medium dark:border-ink-700 dark:bg-ink-900"
                        >
                          <option value="info">Info (dark)</option>
                          <option value="success">Success (teal)</option>
                          <option value="warning">Warning (amber)</option>
                        </select>
                      </label>
                    </>
                  )}
                </div>

                <div className="space-y-3 rounded-xl border border-red-200 p-3 dark:border-red-900/60">
                  <label className="flex items-center justify-between gap-3">
                    <span>
                      <span className="block text-sm font-semibold">Maintenance mode</span>
                      <span className="block text-xs text-ink-400">
                        Visitors are redirected to /maintenance. Admin staff can still sign in.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={config.settings.maintenance.enabled}
                      onChange={(event) => patchMaintenance("enabled", event.target.checked)}
                      className="size-4 accent-red-600"
                    />
                  </label>
                  {config.settings.maintenance.enabled && (
                    <>
                      <div className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        Public pages will be blocked until you publish again with this switch off.
                      </div>
                      <TextField
                        label="Maintenance title"
                        value={config.settings.maintenance.title}
                        onChange={(value) => patchMaintenance("title", value)}
                        maxLength={120}
                      />
                      <TextField
                        label="Message"
                        value={config.settings.maintenance.message}
                        onChange={(value) => patchMaintenance("message", value)}
                        multiline
                        maxLength={600}
                      />
                      <TextField
                        label="Contact email"
                        value={config.settings.maintenance.contactEmail}
                        onChange={(value) => patchMaintenance("contactEmail", value)}
                        maxLength={120}
                      />
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="surface-card overflow-hidden rounded-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 dark:border-ink-800">
              <div>
                <p className="text-sm font-bold">Live preview</p>
                <p className="text-xs text-ink-400">Unsaved edits appear here first — publish when ready.</p>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-ink-100 p-1 dark:bg-ink-800">
                {DEVICES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDevice(id)}
                    className={cn(
                      "flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors",
                      device === id
                        ? "bg-white text-ink-900 shadow-sm dark:bg-ink-900 dark:text-white"
                        : "text-ink-500 hover:text-ink-900 dark:text-ink-400",
                    )}
                    aria-label={`${label} preview`}
                  >
                    <Icon className="size-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-ink-100 p-3 dark:bg-ink-950 sm:p-5">
              <div
                className="mx-auto overflow-hidden rounded-xl border border-ink-200 bg-white shadow-float transition-[width] duration-300 dark:border-ink-700"
                style={{ width: DEVICES.find((item) => item.id === device)?.width, maxWidth: "100%" }}
              >
                <iframe
                  key={previewUrl}
                  src={previewUrl}
                  title="Live website preview"
                  className="block h-[70vh] min-h-[520px] w-full border-0 bg-white"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
