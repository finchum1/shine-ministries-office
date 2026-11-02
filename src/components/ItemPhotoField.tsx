"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// A photo picker for a merch item. Uploads straight to the same public
// storage bucket the Brand logos use and keeps the resulting address in a
// hidden `image_url` field, so the surrounding form saves it like any other
// field.
export function ItemPhotoField({ defaultValue }: { defaultValue?: string | null }) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `merch/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("media").upload(path, file);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(path);
      setUrl(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex basis-full items-center gap-4">
      <input type="hidden" name="image_url" value={url} />
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of an uploaded photo
        <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover ring-1 ring-clay-900/10" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-cream-soft text-xs text-clay-500 ring-1 ring-clay-900/10">
          No photo
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="cursor-pointer rounded-full border border-clay-900/15 px-4 py-2 font-medium text-clay-700 transition-colors hover:border-terracotta hover:text-clay-900">
          {busy ? "Uploading…" : url ? "Change photo" : "Upload photo"}
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
            className="hidden"
          />
        </label>
        {url && (
          <button
            type="button"
            onClick={() => setUrl("")}
            className="font-medium text-clay-500 hover:text-clay-900"
          >
            Remove
          </button>
        )}
        {error && <span className="text-xs text-clay-900">{error}</span>}
      </div>
    </div>
  );
}
