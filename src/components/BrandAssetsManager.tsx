"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BrandAssetRow } from "@/lib/supabase-types";

function slugFileName(file: File) {
  const ext = file.name.split(".").pop() ?? "png";
  return `${crypto.randomUUID()}.${ext}`;
}

function AssetGroup({
  title,
  hint,
  assets,
  busy,
  onUpload,
  onDelete,
}: {
  title: string;
  hint: string;
  assets: BrandAssetRow[];
  busy: boolean;
  onUpload: (files: FileList | null) => void;
  onDelete: (asset: BrandAssetRow) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg text-clay-900">{title}</h2>
          <p className="mt-1 text-sm text-clay-700">{hint}</p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark">
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
          <div
            key={asset.id}
            className="group relative overflow-hidden rounded-xl bg-cream-soft ring-1 ring-clay-900/5"
          >
            <div className="flex aspect-square items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin-only preview, arbitrary size/format */}
              <img src={asset.url} alt={asset.label ?? title} className="max-h-full max-w-full object-contain" />
            </div>
            <p className="truncate border-t border-clay-900/8 bg-white px-2.5 py-1.5 text-xs text-clay-700">
              {asset.label ?? "Untitled"}
            </p>
            <button
              onClick={() => onDelete(asset)}
              disabled={busy}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-clay-700 opacity-0 shadow-sm transition-opacity hover:text-terracotta-dark group-hover:opacity-100"
              aria-label="Delete asset"
            >
              ×
            </button>
          </div>
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

  async function handleDelete(category: "logo" | "icon", asset: BrandAssetRow) {
    setBusy(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.from("brand_assets").delete().eq("id", asset.id);
      if (error) throw error;

      if (category === "logo") setLogos((prev) => prev.filter((a) => a.id !== asset.id));
      else setIcons((prev) => prev.filter((a) => a.id !== asset.id));
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      {errorMessage && (
        <p className="rounded-xl bg-terracotta-light/30 p-4 text-sm text-terracotta-dark">
          {errorMessage}
        </p>
      )}

      <AssetGroup
        title="Logos"
        hint="Full lockups — the main mark used across the site."
        assets={logos}
        busy={busy}
        onUpload={(files) => handleUpload("logo", files)}
        onDelete={(asset) => handleDelete("logo", asset)}
      />

      <AssetGroup
        title="Icons & Favicons"
        hint="Standalone marks used for the favicon, app icon, and social previews."
        assets={icons}
        busy={busy}
        onUpload={(files) => handleUpload("icon", files)}
        onDelete={(asset) => handleDelete("icon", asset)}
      />
    </div>
  );
}
