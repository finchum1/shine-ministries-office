import Link from "next/link";

// The arrow shown left of a sub-page's title (same one the Small Groups and
// Merch Items pages use) to get back to the list without saving.
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-clay-500 transition-colors hover:bg-clay-900/5 hover:text-clay-900"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M12.53 4.22a.75.75 0 0 1 0 1.06L7.81 10l4.72 4.72a.75.75 0 1 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z"
          clipRule="evenodd"
        />
      </svg>
    </Link>
  );
}
