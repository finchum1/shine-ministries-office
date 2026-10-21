// Display names for the Good News Therapy logo set. The keys match the
// `layout` and `colorway` columns of the podcast_logos table (and the file
// names under /brand/podcast on the main site).

export const PODCAST_LAYOUTS: { key: string; label: string; hint: string }[] = [
  { key: "primary", label: "Original layout", hint: "Mic and waves on top, the title, “with Gina Helms-Ouren”, and three dots." },
  { key: "stacked", label: "Stacked", hint: "Mic and waves on top, GOOD NEWS stacked over THERAPY." },
  { key: "horizontal", label: "Mic left, waves on both sides", hint: "Mic and waves on the left, the stacked title on the right." },
  { key: "horizontal-mic", label: "Mic left, one wave", hint: "The layout used on the website’s Podcast page." },
  { key: "horizontal-compact", label: "Compact (no subtitle)", hint: "Without “with Gina Helms-Ouren” — headers and small spaces." },
  { key: "wordmark", label: "Lettering only", hint: "No mic. One line, with “with Gina Helms-Ouren”." },
  { key: "wordmark-stacked", label: "Lettering only, stacked", hint: "No mic. GOOD NEWS over THERAPY, with “with Gina Helms-Ouren”." },
  { key: "icon", label: "Mic + waves icon", hint: "Just the mic and sound waves — stickers, graphics, small marks." },
  { key: "badge-square", label: "Square badge", hint: "The icon on a rounded square — app icons and profile photos." },
  { key: "badge-round", label: "Round badge", hint: "The icon on a circle — profile photos." },
];

// `dark` previews sit on Ocean Depth teal so light-colored logos can be seen.
export const PODCAST_COLORWAYS: Record<string, { label: string; dark: boolean }> = {
  original: { label: "Original colors", dark: false },
  light: { label: "Light (on dark)", dark: true },
  shine: { label: "Shine palette (teal + gold)", dark: false },
  "mono-dark": { label: "One color, dark", dark: false },
  "mono-white": { label: "One color, white", dark: true },
};
