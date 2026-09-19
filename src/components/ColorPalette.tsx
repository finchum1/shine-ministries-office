"use client";

import { useState } from "react";

// "Honey Jar" palette (2026-09-19 rebrand, round 2) -- keep in sync with the
// :root custom properties in src/app/globals.css. This page is a plain
// hardcoded reference (not read from the CSS variables), so it has to be
// updated by hand whenever the palette changes. Role names (Sunset Peach,
// Palm Leaf, etc.) carry over from the previous round since this round's
// picture only supplied hex codes, not new names -- only the hex values
// changed. Sand Dune is untouched this round (see globals.css comment).
const palette = [
  { group: "Sand Dune", swatches: [
    { name: "Sand Dune Light", hex: "#faf7f4" },
    { name: "Sand Dune", hex: "#f4eee8" },
  ]},
  { group: "Sunset Peach", swatches: [
    { name: "Sunset Peach Light", hex: "#f6e8d8" },
    { name: "Sunset Peach", hex: "#ebceae" },
    { name: "Sunset Peach Dark", hex: "#dda567" },
  ]},
  { group: "Palm Leaf", swatches: [
    { name: "Palm Leaf Light", hex: "#d6d0ae" },
    { name: "Palm Leaf", hex: "#aaa06d" },
    { name: "Palm Leaf Dark", hex: "#847c4e" },
  ]},
  { group: "Sea Breeze", swatches: [
    { name: "Sea Breeze", hex: "#e0af70" },
    { name: "Sea Breeze Dark", hex: "#a67b44" },
  ]},
  { group: "Citrus Zest", swatches: [
    { name: "Citrus Zest", hex: "#f5b74e" },
    { name: "Citrus Zest Dark", hex: "#d89627" },
  ]},
  { group: "Ocean Depth (text)", swatches: [
    { name: "Ocean Depth Light", hex: "#929b92" },
    { name: "Ocean Depth Mid", hex: "#778477" },
    { name: "Ocean Depth", hex: "#5d695d" },
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
