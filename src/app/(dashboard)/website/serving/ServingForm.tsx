import type { ServingOpportunityRow } from "@/lib/supabase-types";

const inputClass =
  "w-full rounded-xl border border-clay-900/12 bg-cream px-4 py-3 text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30";

export function ServingForm({
  opportunity,
  action,
}: {
  opportunity?: ServingOpportunityRow;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Title</span>
        <input name="title" required defaultValue={opportunity?.title} className={inputClass} />
      </label>

      <label className="sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Description</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={opportunity?.description ?? ""}
          className={`${inputClass} resize-none`}
        />
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Sort order</span>
        <input
          type="number"
          name="sort_order"
          defaultValue={opportunity?.sort_order ?? 0}
          className={inputClass}
        />
      </label>

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-sage px-6 py-3 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark"
        >
          {opportunity ? "Save changes" : "Create opportunity"}
        </button>
      </div>
    </form>
  );
}
