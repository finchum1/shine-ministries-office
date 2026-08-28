"use client";

import { useState } from "react";

const palette = [
  { group: "Cream", swatches: [
    { name: "cream", hex: "#fbf7f0" },
    { name: "cream-soft", hex: "#f6efe3" },
  ]},
  { group: "Terracotta", swatches: [
    { name: "terracotta-light", hex: "#e3b7a0" },
    { name: "terracotta", hex: "#c15f3b" },
    { name: "terracotta-dark", hex: "#9c4a2c" },
  ]},
  { group: "Sage", swatches: [
    { name: "sage-light", hex: "#c7d0b9" },
    { name: "sage", hex: "#93a17e" },
    { name: "sage-dark", hex: "#6e7d5c" },
  ]},
  { group: "Lavender", swatches: [
    { name: "lavender", hex: "#a89bc4" },
    { name: "lavender-dark", hex: "#8574a3" },
  ]},
  { group: "Clay (text)", swatches: [
    { name: "clay-500", hex: "#8c7c6a" },
    { name: "clay-700", hex: "#6b5c4c" },
    { name: "clay-900", hex: "#453a2f" },
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
