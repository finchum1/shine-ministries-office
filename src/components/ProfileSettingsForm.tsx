"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function slugFileName(file: File) {
  const ext = file.name.split(".").pop() ?? "jpg";
  return `${crypto.randomUUID()}.${ext}`;
}

export function ProfileSettingsForm({
  email,
  initialAvatarUrl,
}: {
  email: string;
  initialAvatarUrl: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const path = `avatars/${user.id}-${slugFileName(file)}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(path);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <p className="rounded-xl bg-terracotta-light/30 p-4 text-sm text-terracotta-dark">
          {errorMessage}
        </p>
      )}

      <div>
        <p className="mb-1.5 text-sm font-medium text-clay-700">Email</p>
        <p className="text-sm text-clay-900">{email}</p>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-clay-700">Profile photo</p>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sage/20 text-lg font-semibold text-sage-dark">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-only preview, arbitrary user upload
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              (email[0] ?? "?").toUpperCase()
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-clay-900/15 px-5 py-2.5 text-sm font-medium text-clay-700 transition-colors hover:border-terracotta hover:text-terracotta-dark">
            {busy ? "Uploading…" : avatarUrl ? "Replace photo" : "Upload photo"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(e) => handleUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
