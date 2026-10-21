import Link from "next/link";

// The submit button plus a Cancel link that backs out to the list without
// saving -- shared by the New/Edit forms so none of them is a dead end.
export function FormButtons({
  submitLabel,
  cancelHref,
  className = "",
}: {
  submitLabel: string;
  cancelHref: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-sage px-6 py-3 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:brightness-95"
      >
        {submitLabel}
      </button>
      <Link href={cancelHref} className="text-sm font-medium text-clay-500 hover:text-clay-900">
        Cancel
      </Link>
    </div>
  );
}
