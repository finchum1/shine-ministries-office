export function TypographySpecimen() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div className="rounded-2xl bg-cream-soft p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-clay-500">
          Display — Fraunces
        </p>
        <p className="font-display text-3xl text-clay-900">Brighter and Brighter.</p>
        <p className="font-display text-3xl italic text-clay-900">Brighter and Brighter.</p>
        <p className="mt-4 text-sm leading-relaxed text-clay-700">
          Used for headings and section titles across the site. Italic weight is used for
          quotes, verses, and the closing line of the founder&rsquo;s bio.
        </p>
      </div>

      <div className="rounded-2xl bg-cream-soft p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-clay-500">
          Body — Inter
        </p>
        <p className="text-base leading-relaxed text-clay-900">
          Gathering and empowering women to cultivate a healthy soul to shine His glory.
        </p>
        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-terracotta-dark">
          Eyebrow / label style
        </p>
        <p className="mt-4 text-sm leading-relaxed text-clay-700">
          Used for all body copy, navigation, buttons, and form labels.
        </p>
      </div>
    </div>
  );
}
