import { createClient } from "@/lib/supabase/server";
import type { FolderRow, FileRow } from "@/lib/supabase-types";
import { FilesManager } from "@/components/FilesManager";

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const { folder } = await searchParams;
  const currentFolderId = folder ?? null;

  const supabase = await createClient();

  const [{ data: allFolders }, { data: subfolders }, { data: files }] = await Promise.all([
    supabase.from("file_folders").select("*").order("sort_order", { ascending: true }),
    currentFolderId
      ? supabase
          .from("file_folders")
          .select("*")
          .eq("parent_id", currentFolderId)
          .order("sort_order", { ascending: true })
      : supabase
          .from("file_folders")
          .select("*")
          .is("parent_id", null)
          .order("sort_order", { ascending: true }),
    currentFolderId
      ? supabase
          .from("files")
          .select("*")
          .eq("folder_id", currentFolderId)
          .order("created_at", { ascending: false })
      : supabase
          .from("files")
          .select("*")
          .is("folder_id", null)
          .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-clay-900">Files</h1>
      <p className="mt-1 text-sm text-clay-700">
        Important documents, organized into folders — visible only to signed-in admins.
      </p>

      <div className="mt-6">
        <FilesManager
          allFolders={(allFolders as FolderRow[] | null) ?? []}
          currentFolderId={currentFolderId}
          subfolders={(subfolders as FolderRow[] | null) ?? []}
          files={(files as FileRow[] | null) ?? []}
        />
      </div>
    </div>
  );
}
