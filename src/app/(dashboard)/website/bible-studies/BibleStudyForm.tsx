import type { BibleStudyRow } from "@/lib/supabase-types";

const inputClass =
  "w-full rounded-xl border border-clay-900/12 bg-cream px-4 py-3 text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30";

export function BibleStudyForm({
  study,
  action,
}: {
  study?: BibleStudyRow;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Title</span>
        <input name="title" required defaultValue={study?.title} className={inputClass} />
      </label>

      <label className="sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Description</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={study?.description ?? ""}
          className={`${inputClass} resize-none`}
        />
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Day of week</span>
        <input
          name="day_of_week"
          defaultValue={study?.day_of_week ?? ""}
          className={inputClass}
          placeholder="Tuesdays"
        />
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Meeting time</span>
        <input
          name="meeting_time"
          defaultValue={study?.meeting_time ?? ""}
          className={inputClass}
          placeholder="9:30–11:00 AM"
        />
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Location</span>
        <input name="location" defaultValue={study?.location ?? ""} className={inputClass} />
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Leader name</span>
        <input name="leader_name" defaultValue={study?.leader_name ?? ""} className={inputClass} />
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Sort order</span>
        <input
          type="number"
          name="sort_order"
          defaultValue={study?.sort_order ?? 0}
          className={inputClass}
        />
      </label>

      <label className="flex items-center gap-2 self-end pb-3 text-sm text-clay-700">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={study?.is_active ?? true}
          className="h-4 w-4 rounded border-clay-900/20"
        />
        Active (visible on the live site)
      </label>

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-sage px-6 py-3 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark"
        >
          {study ? "Save changes" : "Create Bible study"}
        </button>
      </div>
    </form>
  );
}
