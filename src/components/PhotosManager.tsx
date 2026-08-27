"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PhotoRow } from "@/lib/supabase-types";

function slugFileName(file: File) {
  const ext = file.name.split(".").pop() ?? "jpg";
  return `${crypto.randomUUID()}.${ext}`;
}

export function PhotosManager({
  initialGroupPhotos,
  initialFounderPhoto,
}: {
  initialGroupPhotos: PhotoRow[];
  initialFounderPhoto: PhotoRow | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [groupPhotos, setGroupPhotos] = useState(initialGroupPhotos);
  const [founderPhoto, setFounderPhoto] = useState(initialFounderPhoto);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const groupInputRef = useRef<HTMLInputElement>(null);
  const founderInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File, category: "group" | "founder") {
    const path = `${category}/${slugFileName(file)}`;
    const { error: uploadError } = await supabase.storage.from("media").upload(path, file);
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(path);

    return publicUrl;
  }

  async function handleGroupUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const startOrder = groupPhotos.length;
      const newRows: PhotoRow[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFile(files[i], "group");
        const { data, error } = await supabase
          .from("photos")
          .insert({ category: "group", url, sort_order: startOrder + i })
          .select()
          .single();
        if (error) throw error;
        newRows.push(data as PhotoRow);
      }
      setGroupPhotos((prev) => [...prev, ...newRows]);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (groupInputRef.current) groupInputRef.current.value = "";
    }
  }

  async function handleFounderUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const url = await uploadFile(files[0], "founder");

      // Only one founder photo at a time — remove any existing row(s) first.
      if (founderPhoto) {
        await supabase.from("photos").delete().eq("id", founderPhoto.id);
      }
      const { data, error } = await supabase
        .from("photos")
        .insert({ category: "founder", url, sort_order: 0 })
        .select()
        .single();
      if (error) throw error;

      setFounderPhoto(data as PhotoRow);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (founderInputRef.current) founderInputRef.current.value = "";
    }
  }

  async function handleDrop(dropIndex: number) {
    setDragOverIndex(null);
    const fromIndex = dragIndex;
    setDragIndex(null);
    if (fromIndex === null || fromIndex === dropIndex) return;

    const reordered = [...groupPhotos];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    setGroupPhotos(reordered);

    setBusy(true);
    setErrorMessage(null);
    try {
      const changed = reordered
        .map((photo, index) => ({ photo, index }))
        .filter(({ photo, index }) => photo.sort_order !== index);

      for (const { photo, index } of changed) {
        const { error } = await supabase.from("photos").update({ sort_order: index }).eq("id", photo.id);
        if (error) throw error;
      }

      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Reorder failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteGroupPhoto(photo: PhotoRow) {
    setBusy(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.from("photos").delete().eq("id", photo.id);
      if (error) throw error;
      setGroupPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 space-y-10">
      {errorMessage && (
        <p className="rounded-xl bg-terracotta-light/30 p-4 text-sm text-terracotta-dark">
          {errorMessage}
        </p>
      )}

      <section>
        <h2 className="font-display text-lg text-clay-900">Founder photo</h2>
        <p className="mt-1 text-sm text-clay-700">Shown on the About page&rsquo;s founder section.</p>
        <div className="mt-4 flex items-center gap-6">
          <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-cream-soft ring-1 ring-clay-900/5">
            {founderPhoto && (
              // eslint-disable-next-line @next/next/no-img-element -- admin-only preview, not the public site
              <img src={founderPhoto.url} alt="Founder" className="h-full w-full object-cover" />
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-clay-900/15 px-5 py-2.5 text-sm font-medium text-clay-700 transition-colors hover:border-terracotta hover:text-terracotta-dark">
            {busy ? "Working…" : founderPhoto ? "Replace photo" : "Upload photo"}
            <input
              ref={founderInputRef}
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(e) => handleFounderUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg text-clay-900">Group photos</h2>
            <p className="mt-1 text-sm text-clay-700">
              The photo grid on the About page. Drag to reorder.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark">
            {busy ? "Working…" : "Add photos"}
            <input
              ref={groupInputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={busy}
              onChange={(e) => handleGroupUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {groupPhotos.map((photo, index) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnter={() => setDragOverIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={() => {
                setDragIndex(null);
                setDragOverIndex(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(index);
              }}
              className={`group relative aspect-square cursor-grab overflow-hidden rounded-xl bg-cream-soft ring-1 ring-clay-900/5 transition-shadow active:cursor-grabbing ${
                dragOverIndex === index && dragIndex !== index ? "ring-2 ring-terracotta" : ""
              } ${dragIndex === index ? "opacity-40" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- admin-only preview, not the public site */}
              <img
                src={photo.url}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-clay-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                ⠿
              </div>
              <button
                onClick={() => handleDeleteGroupPhoto(photo)}
                disabled={busy}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-clay-700 opacity-0 shadow-sm transition-opacity hover:text-terracotta-dark group-hover:opacity-100"
                aria-label="Delete photo"
              >
                ×
              </button>
            </div>
          ))}
          {groupPhotos.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-clay-500">
              No group photos yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
