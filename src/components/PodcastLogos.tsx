"use client";

import { useState } from "react";
import type { PodcastLogoRow } from "@/lib/supabase-types";
import { PODCAST_COLORWAYS, PODCAST_LAYOUTS } from "@/lib/podcast-logos";

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

// Fetch as a blob rather than a plain <a download> link: these files live on
// the main site's domain, and browsers ignore `download` on cross-origin
// links (they just open the file). A blob: URL is same-origin, so the save
// always happens.
async function downloadFile(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn’t download that file (${res.status}).`);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = url.split("/").pop()?.split("?")[0] || "good-news-therapy-logo";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

function DownloadButton({
  label,
  url,
  onError,
}: {
  label: string;
  url: string;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await downloadFile(url);
        } catch (e) {
          onError(e instanceof Error ? e.message : "Download failed.");
        } finally {
          setBusy(false);
        }
      }}
      title={`Download ${label}`}
      className="rounded-full border border-clay-900/15 px-2.5 py-1 text-xs font-medium text-clay-700 transition-colors hover:border-terracotta hover:text-clay-900 disabled:opacity-50"
    >
      {busy ? "…" : label}
    </button>
  );
}

function LogoCard({
  logo,
  layoutLabel,
  onError,
}: {
  logo: PodcastLogoRow;
  layoutLabel: string;
  onError: (message: string) => void;
}) {
  const color = PODCAST_COLORWAYS[logo.colorway] ?? { label: logo.colorway, dark: false };
  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-clay-900/8">
      <div
        className={`flex h-36 items-center justify-center p-4 ${
          color.dark ? "bg-clay-900" : "bg-cream-soft"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- admin-only preview of a hosted SVG */}
        <img
          src={logo.svg_url}
          alt={`${layoutLabel} — ${color.label}`}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-clay-900/8 px-3 py-2">
        <p className="min-w-0 flex-1 truncate text-xs text-clay-700">{color.label}</p>
        <div className="flex shrink-0 gap-1.5">
          <DownloadButton label="SVG" url={logo.svg_url} onError={onError} />
          <DownloadButton label="PNG" url={logo.png_url} onError={onError} />
        </div>
      </div>
    </div>
  );
}

function LayoutGroup({
  layout,
  logos,
  defaultOpen,
  onError,
}: {
  layout: { key: string; label: string; hint: string };
  logos: PodcastLogoRow[];
  defaultOpen: boolean;
  onError: (message: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-clay-900/8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 bg-white px-4 py-3 text-left transition-colors hover:bg-cream-soft"
        aria-expanded={open}
        aria-controls={`podcast-layout-${layout.key}`}
      >
        <span className="min-w-0">
          <span className="block font-medium text-clay-900">{layout.label}</span>
          <span className="block text-xs text-clay-500">{layout.hint}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-clay-500">
            {logos.length} {logos.length === 1 ? "version" : "versions"}
          </span>
          <ChevronIcon open={open} />
        </span>
      </button>
      {open && (
        <div
          id={`podcast-layout-${layout.key}`}
          className="grid gap-3 bg-cream-soft p-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {logos.map((logo) => (
            <LogoCard key={logo.id} logo={logo} layoutLabel={layout.label} onError={onError} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PodcastLogos({ logos }: { logos: PodcastLogoRow[] }) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const byLayout = new Map<string, PodcastLogoRow[]>();
  for (const logo of logos) {
    const list = byLayout.get(logo.layout) ?? [];
    list.push(logo);
    byLayout.set(logo.layout, list);
  }
  // Known layouts in their set order, then anything added later.
  const known = PODCAST_LAYOUTS.filter((l) => byLayout.has(l.key));
  const extra = [...byLayout.keys()]
    .filter((k) => !PODCAST_LAYOUTS.some((l) => l.key === k))
    .map((k) => ({ key: k, label: k, hint: "" }));
  const groups = [...known, ...extra];

  return (
    <div>
      <h2 className="font-display text-lg text-clay-900">Good News Therapy</h2>
      <p className="mt-1 text-sm text-clay-700">
        Every layout and color version of the podcast logo, as a vector SVG (scales to any size)
        and a PNG with a transparent background. Click a layout to open it.
      </p>

      {errorMessage && (
        <p className="mt-4 rounded-xl bg-terracotta-light/30 p-4 text-sm text-clay-900">
          {errorMessage}
        </p>
      )}

      <div className="mt-4 space-y-2">
        {groups.map((layout, i) => (
          <LayoutGroup
            key={layout.key}
            layout={layout}
            logos={byLayout.get(layout.key) ?? []}
            defaultOpen={i === 0}
            onError={setErrorMessage}
          />
        ))}
        {groups.length === 0 && (
          <p className="py-6 text-center text-sm text-clay-500">No podcast logos yet.</p>
        )}
      </div>
    </div>
  );
}
