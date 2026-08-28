"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createFolder(parentId: string | null, name: string) {
  const supabase = await createClient();
  const trimmed = name.trim();
  if (!trimmed) return;

  const { error } = await supabase
    .from("file_folders")
    .insert({ name: trimmed, parent_id: parentId });
  if (error) throw new Error(error.message);

  revalidatePath("/files");
}

export async function deleteFolder(folderId: string) {
  const supabase = await createClient();

  const [{ count: subfolderCount }, { count: fileCount }] = await Promise.all([
    supabase
      .from("file_folders")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", folderId),
    supabase.from("files").select("id", { count: "exact", head: true }).eq("folder_id", folderId),
  ]);

  if ((subfolderCount ?? 0) > 0 || (fileCount ?? 0) > 0) {
    throw new Error("This folder isn't empty. Move or delete what's inside it first.");
  }

  const { error } = await supabase.from("file_folders").delete().eq("id", folderId);
  if (error) throw new Error(error.message);

  revalidatePath("/files");
}

export async function deleteFile(fileId: string, path: string) {
  const supabase = await createClient();

  const { error: storageError } = await supabase.storage.from("documents").remove([path]);
  if (storageError) throw new Error(storageError.message);

  const { error } = await supabase.from("files").delete().eq("id", fileId);
  if (error) throw new Error(error.message);

  revalidatePath("/files");
}
