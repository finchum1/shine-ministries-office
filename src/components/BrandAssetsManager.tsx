"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BrandAssetRow } from "@/lib/supabase-types";

function slugFileName(file: File) {
  const ext = file.name.split(".").pop() ?? "png";
  return `${crypto.randomUUID()}.${ext}`;
}

function downloadFileName(asset: BrandAssetRow) {
  const ext = asset.url.split(".").pop()?.split("?")[0] || "png";
  const base = (asset.label || "shine-brand-asset")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "shine-brand-asset"}.${ext}`;
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M10 2.5a.75.75 0 0 1 .75.75v8.19l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 1 1 1.06-1.06l2.72 2.72V3.25A.75.75 0 0 1 10 2.5Z" />
      <path d="M3.5 13.25a.75.75 0 0 1 .75.75v1.5c0 .414.336.75.75.75h10a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 1 1.5 0v1.5A2.25 2.25 0 0 1 15 18H5a2.25 2.25 0 0 1-2.25-2.25v-1.5a.75.75 0 0 1 .75-.75Z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

async function downloadAsset(asset: BrandAssetRow) {
  // Fetch as a blob rather than a plain <a download> link -- these assets are
  // served cross-origin (Supabase Storage or the main site's own domain),
  // and browsers generally ignore the download attribute on cross-origin
  // anchors, just opening the image instead of saving it. A blob: URL is
  // always same-origin, so download is honored reliably every time.
  const res = await fetch(asset.url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = downloadFileName(asset);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

function AssetCard({ asset, title }: { asset: BrandAssetRow; title: string }) {
  return (
    <div className="overflow-hidden rounded-xl bg-cream-soft ring-1 ring-clay-900/5">
      <div className="flex aspect-square items-center justify-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin-only preview, arbitrary size/format */}
        <img src={asset.url} alt={asset.label ?? title} className="max-h-full max-w-full object-contain" />
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-clay-900/8 bg-white px-2.5 py-1.5">
        <p className="min-w-0 flex-1 truncate text-xs text-clay-700">{asset.label ?? "Untitled"}</p>
        <button
          type="button"
          onClick={() => downloadAsset(asset)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-clay-500 transition-colors hover:bg-clay-900/5 hover:text-clay-900"
          aria-label={`Download ${asset.label ?? title}`}
          title="Download PNG"
        >
          <DownloadIcon />
        </button>
      </div>
    </div>
  );
}

// The full set of colors the wordmark currently ships in, in display order.
// swatch is what renders on the toggle -- a literal hex for real colors,
// or a distinct treatment for black/white so they don't disappear against
// the card background.
const LOGO_FAMILIES: { key: string; label: string; swatch: string }[] = [
  { key: "black", label: "Black", swatch: "#000000" },
  { key: "white", label: "White", swatch: "#ffffff" },
  { key: "sand-dune", label: "Sand Dune", swatch: "#f4eee8" },
  { key: "sunset-peach", label: "Sunset Peach", swatch: "#f5d4c0" },
  { key: "palm-leaf", label: "Palm Leaf", swatch: "#8fa98b" },
  { key: "sea-breeze", label: "Sea Breeze", swatch: "#a9c6c2" },
  { key: "citrus-zest", label: "Citrus Zest", swatch: "#e6c15a" },
  { key: "ocean-depth", label: "Ocean Depth", swatch: "#395b63" },
];

function LogoFamilyToggle({
  familyKey,
  label,
  swatch,
  assets,
  defaultOpen = false,
}: {
  familyKey: string;
  label: string;
  swatch: string;
  assets: BrandAssetRow[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-clay-900/8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 bg-white px-4 py-3 text-left transition-colors hover:bg-cream-soft"
        aria-expanded={open}
        aria-controls={`logo-family-${familyKey}`}
      >
        <span className="flex items-center gap-3">
          <span
            className="h-6 w-6 shrink-0 rounded-full ring-1 ring-clay-900/15"
            style={{ backgroundColor: swatch }}
          />
          <span className="font-medium text-clay-900">{label}</span>
          <span className="text-xs text-clay-500">
            {assets.length} {assets.length === 1 ? "variant" : "variants"}
          </span>
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div id={`logo-family-${familyKey}`} className="grid grid-cols-2 gap-3 bg-cream-soft p-3 sm:grid-cols-3 md:grid-cols-4">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} title={label} />
          ))}
        </div>
      )}
    </div>
  );
}

function LogosSection({
  assets,
  busy,
  onUpload,
}: {
  assets: BrandAssetRow[];
  busy: boolean;
  onUpload: (files: FileList | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const byFamily = new Map<string, BrandAssetRow[]>();
  const other: BrandAssetRow[] = [];
  for (const asset of assets) {
    if (asset.color_family && LOGO_FAMILIES.some((f) => f.key === asset.color_family)) {
      const list = byFamily.get(asset.color_family) ?? [];
      list.push(asset);
      byFamily.set(asset.color_family, list);
    } else {
      other.push(asset);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg text-clay-900">Logos</h2>
          <p className="mt-1 text-sm text-clay-700">
            Full lockups — grouped by color, each with every weight on hand. Click a color to see its variants.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:brightness-95">
          {busy ? "Working…" : "Add"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.ico"
            multiple
            disabled={busy}
            onChange={(e) => {
              onUpload(e.target.files);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="hidden"
          />
        </label>
      </div>

      <div className="mt-4 space-y-2">
        {LOGO_FAMILIES.map((family) => {
          const familyAssets = byFamily.get(family.key) ?? [];
          if (familyAssets.length === 0) return null;
          return (
            <LogoFamilyToggle
              key={family.key}
              familyKey={family.key}
              label={family.label}
              swatch={family.swatch}
              assets={familyAssets}
            />
          );
        })}
        {other.length > 0 && (
          <LogoFamilyToggle
            familyKey="other"
            label="Other"
            swatch="#faf7f4"
            assets={other}
            defaultOpen
          />
        )}
        {assets.length === 0 && (
          <p className="py-6 text-center text-sm text-clay-500">Nothing here yet.</p>
        )}
      </div>
    </section>
  );
}

function AssetGroup({
  title,
  hint,
  assets,
  busy,
  onUpload,
}: {
  title: string;
  hint: string;
  assets: BrandAssetRow[];
  busy: boolean;
  onUpload: (files: FileList | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg text-clay-900">{title}</h2>
          <p className="mt-1 text-sm text-clay-700">{hint}</p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:brightness-95">
          {busy ? "Working…" : "Add"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.ico"
            multiple
            disabled={busy}
            onChange={(e) => {
              onUpload(e.target.files);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="hidden"
          />
        </label>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} title={title} />
        ))}
        {assets.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-clay-500">Nothing here yet.</p>
        )}
      </div>
    </section>
  );
}

export function BrandAssetsManager({
  initialLogos,
  initialIcons,
}: {
  initialLogos: BrandAssetRow[];
  initialIcons: BrandAssetRow[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [logos, setLogos] = useState(initialLogos);
  const [icons, setIcons] = useState(initialIcons);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleUpload(category: "logo" | "icon", files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const existing = category === "logo" ? logos : icons;
      const startOrder = existing.length;
      const newRows: BrandAssetRow[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `brand/${category}/${slugFileName(file)}`;
        const { error: uploadError } = await supabase.storage.from("media").upload(path, file);
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("media").getPublicUrl(path);

        const { data, error } = await supabase
          .from("brand_assets")
          .insert({
            category,
            label: file.name.replace(/\.[^.]+$/, ""),
            url: publicUrl,
            sort_order: startOrder + i,
          })
          .select()
          .single();
        if (error) throw error;
        newRows.push(data as BrandAssetRow);
      }

      if (category === "logo") setLogos((prev) => [...prev, ...newRows]);
      else setIcons((prev) => [...prev, ...newRows]);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      {errorMessage && (
        <p className="rounded-xl bg-terracotta-light/30 p-4 text-sm text-clay-900">
          {errorMessage}
        </p>
      )}

      <LogosSection assets={logos} busy={busy} onUpload={(files) => handleUpload("logo", files)} />

      <AssetGroup
        title="Icons & Favicons"
        hint="Standalone marks used for the favicon, app icon, and social previews."
        assets={icons}
        busy={busy}
        onUpload={(files) => handleUpload("icon", files)}
      />
    </div>
  );
}
