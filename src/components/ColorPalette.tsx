"use client";

import { useState } from "react";

// "Summer Escape" palette -- reverted 2026-09-19 back to this exact picture
// after a brief "Honey Jar" round, per Terrence's request. Keep in sync with
// the :root custom properties in src/app/globals.css. This page is a plain
// hardcoded reference (not read from the CSS variables), so it has to be
// updated by hand whenever the palette changes.
const palette = [
  { group: "Sand Dune", swatches: [
    { name: "Sand Dune Light", hex: "#faf7f4" },
    { name: "Sand Dune", hex: "#f4eee8" },
  ]},
  { group: "Sunset Peach", swatches: [
    { name: "Sunset Peach Light", hex: "#f5d4c0" },
    { name: "Sunset Peach", hex: "#e9a67c" },
    { name: "Sunset Peach Dark", hex: "#e37a39" },
  ]},
  { group: "Palm Leaf", swatches: [
    { name: "Palm Leaf Light", hex: "#c3d4c0" },
    { name: "Palm Leaf", hex: "#8fa98b" },
    { name: "Palm Leaf Dark", hex: "#688564" },
  ]},
  { group: "Sea Breeze", swatches: [
    { name: "Sea Breeze", hex: "#a9c6c2" },
    { name: "Sea Breeze Dark", hex: "#6f918c" },
  ]},
  { group: "Citrus Zest", swatches: [
    { name: "Citrus Zest", hex: "#e6c15a" },
    { name: "Citrus Zest Dark", hex: "#c6a036" },
  ]},
  { group: "Ocean Depth (text)", swatches: [
    { name: "Ocean Depth Light", hex: "#7197a0" },
    { name: "Ocean Depth Mid", hex: "#527c86" },
    { name: "Ocean Depth", hex: "#395b63" },
  ]},
];

function Swatch({ name, hex }: { name: string; hex: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(hex).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="group text-left"
    >
      <div
        className="h-16 w-full rounded-xl ring-1 ring-clay-900/10 transition-transform group-hover:scale-[1.02]"
        style={{ backgroundColor: hex }}
      />
      <p className="mt-2 text-sm font-medium text-clay-900">{name}</p>
      <p className="text-xs text-clay-500">{copied ? "Copied!" : hex}</p>
    </button>
  );
}

export function ColorPalette() {
  return (
    <div className="space-y-6">
      {palette.map((group) => (
        <div key={group.group}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-clay-500">
            {group.group}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {group.swatches.map((s) => (
              <Swatch key={s.name} name={s.name} hex={s.hex} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
