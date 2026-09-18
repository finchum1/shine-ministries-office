// Mirrors src/components/ui/SunMark.tsx in the main shine-ministries site
// (the sun graphic next to the homepage hero) -- reused here as the drag
// handle for Small Groups so it reads as an on-brand "grab this" affordance
// instead of a generic dots glyph.
export function SunMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="9" fill="currentColor" />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4;
        const x1 = 24 + Math.cos(angle) * 15;
        const y1 = 24 + Math.sin(angle) * 15;
        const x2 = 24 + Math.cos(angle) * 21;
        const y2 = 24 + Math.sin(angle) * 21;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
