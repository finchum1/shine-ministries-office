// Outline icons for the sidebar, one per module. Same 24px, 1.7-stroke style
// as The Agency dashboard's menu so the two back offices feel related.
const PATHS = {
  website: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.3 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.3-3.5-8.5S9.6 5.9 12 3.5z" />
    </>
  ),
  leadership: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3 20c.4-3.5 3-5.5 6-5.5s5.6 2 6 5.5" />
      <path d="M16 5.6a3.2 3.2 0 0 1 0 5.8M18 14.8c1.8.7 3 2.3 3.2 5.2" />
    </>
  ),
  merch: (
    <>
      <path d="M5 8h14l-1 11.5a1 1 0 0 1-1 .9H7a1 1 0 0 1-1-.9z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </>
  ),
  brand: (
    <>
      <path d="M12 3.5c3.6 3.9 6 6.9 6 10a6 6 0 0 1-12 0c0-3.1 2.4-6.1 6-10z" />
      <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
    </>
  ),
  files: <path d="M3.5 7.5a1.5 1.5 0 0 1 1.5-1.5h4l2 2.5H19a1.5 1.5 0 0 1 1.5 1.5V18A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18z" />,
  admin: <path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.2-7.5 9.5-4.4-1.3-7.5-4.9-7.5-9.5V6z" />,
  signout: <path d="M10 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H10M15 8l4 4-4 4M19 12H9.5" />,
};

export type NavIconName = keyof typeof PATHS;

export function NavIcon({ name, className = "" }: { name: NavIconName; className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
