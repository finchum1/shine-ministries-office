"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FolderRow, FileRow } from "@/lib/supabase-types";
import { createFolder, deleteFolder, deleteFile } from "@/app/(dashboard)/files/actions";

function FolderIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-sage-dark">
      <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h4.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 0 11.12 6.5H16.5A1.5 1.5 0 0 1 18 8v6.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 14.5v-9Z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-clay-500">
      <path
        fillRule="evenodd"
        d="M4 2.5A1.5 1.5 0 0 1 5.5 1h5.586a1.5 1.5 0 0 1 1.06.44l3.415 3.414a1.5 1.5 0 0 1 .439 1.06V17.5A1.5 1.5 0 0 1 14.5 19h-9A1.5 1.5 0 0 1 4 17.5v-15Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M10 2.5a.75.75 0 0 1 .75.75v8.19l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 1 1 1.06-1.06l2.72 2.72V3.25A.75.75 0 0 1 10 2.5Z" />
      <path d="M3.5 13.25a.75.75 0 0 1 .75.75v1.5c0 .414.336.75.75.75h10a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 1 1.5 0v1.5A2.25 2.25 0 0 1 15 18H5a2.25 2.25 0 0 1-2.25-2.25v-1.5a.75.75 0 0 1 .75-.75Z" />
    </svg>
  );
}

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function slugPath(file: File) {
  const ext = file.name.split(".").pop() ?? "";
  const safeExt = ext ? `.${ext}` : "";
  return `${crypto.randomUUID()}${safeExt}`;
}

export function FilesManager({
  allFolders,
  currentFolderId,
  subfolders,
  files,
}: {
  allFolders: FolderRow[];
  currentFolderId: string | null;
  subfolders: FolderRow[];
  files: FileRow[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const breadcrumb: FolderRow[] = [];
  let cursor = allFolders.find((f) => f.id === currentFolderId) ?? null;
  while (cursor) {
    breadcrumb.unshift(cursor);
    cursor = allFolders.find((f) => f.id === cursor!.parent_id) ?? null;
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const path = slugPath(file);
        const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
        if (uploadError) throw uploadError;

        const { error } = await supabase.from("files").insert({
          folder_id: currentFolderId,
          name: file.name,
          path,
          size_bytes: file.size,
          content_type: file.type || null,
        });
        if (error) throw error;
      }
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDownload(file: FileRow) {
    setErrorMessage(null);
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(file.path, 60, { download: file.name });
      if (error) throw error;
      window.location.href = data.signedUrl;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Download failed.");
    }
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      await createFolder(currentFolderId, newFolderName.trim());
      setNewFolderName("");
      setShowNewFolder(false);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Couldn't create folder.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteFolder(folder: FolderRow) {
    setBusy(true);
    setErrorMessage(null);
    try {
      await deleteFolder(folder.id);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Couldn't delete folder.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteFile(file: FileRow) {
    setBusy(true);
    setErrorMessage(null);
    try {
      await deleteFile(file.id, file.path);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Couldn't delete file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {errorMessage && (
        <p className="mb-4 rounded-xl bg-terracotta-light/30 p-4 text-sm text-terracotta-dark">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap items-center gap-1 text-sm text-clay-700">
          <Link href="/files" className="rounded-lg px-2 py-1 font-medium hover:bg-clay-900/5">
            Files
          </Link>
          {breadcrumb.map((folder) => (
            <span key={folder.id} className="flex items-center gap-1">
              <span className="text-clay-400">/</span>
              <Link
                href={`/files?folder=${folder.id}`}
                className="rounded-lg px-2 py-1 font-medium hover:bg-clay-900/5"
              >
                {folder.name}
              </Link>
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewFolder((s) => !s)}
            className="inline-flex items-center justify-center rounded-full border border-clay-900/15 px-4 py-2 text-sm font-medium text-clay-700 transition-colors hover:border-terracotta hover:text-terracotta-dark"
          >
            New folder
          </button>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-sage px-5 py-2 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark">
            {busy ? "Working…" : "Upload"}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              disabled={busy}
              onChange={(e) => handleUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {showNewFolder && (
        <form onSubmit={handleCreateFolder} className="mt-4 flex items-center gap-2">
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="w-full max-w-xs rounded-xl border border-clay-900/12 bg-cream px-4 py-2.5 text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-sage px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-sage-dark"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setShowNewFolder(false)}
            className="text-sm font-medium text-clay-500 hover:text-terracotta-dark"
          >
            Cancel
          </button>
        </form>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-clay-900/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-soft text-xs font-semibold uppercase tracking-wide text-clay-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Size</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-clay-900/8">
            {subfolders.map((folder) => (
              <tr key={folder.id}>
                <td className="px-5 py-3">
                  <Link
                    href={`/files?folder=${folder.id}`}
                    className="flex items-center gap-2.5 font-medium text-clay-900 hover:text-terracotta-dark"
                  >
                    <FolderIcon />
                    {folder.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-clay-500">—</td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => handleDeleteFolder(folder)}
                    disabled={busy}
                    className="text-sm font-medium text-clay-500 hover:text-terracotta-dark"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {files.map((file) => (
              <tr key={file.id}>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-2.5 font-medium text-clay-900">
                    <FileIcon />
                    {file.name}
                  </span>
                </td>
                <td className="px-5 py-3 text-clay-700">{formatSize(file.size_bytes)}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => handleDownload(file)}
                    className="mr-3 inline-flex items-center gap-1 text-sm font-medium text-terracotta-dark hover:underline"
                  >
                    <DownloadIcon />
                    Download
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file)}
                    disabled={busy}
                    className="text-sm font-medium text-clay-500 hover:text-terracotta-dark"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {subfolders.length === 0 && files.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-clay-500">
                  This folder is empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
