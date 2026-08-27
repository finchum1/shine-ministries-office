import type { EventRow } from "@/lib/supabase-types";

const inputClass =
  "w-full rounded-xl border border-clay-900/12 bg-cream px-4 py-3 text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30";

export function EventForm({
  event,
  action,
}: {
  event?: EventRow;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Title</span>
        <input name="title" required defaultValue={event?.title} className={inputClass} />
      </label>

      <label className="sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Description</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={event?.description ?? ""}
          className={`${inputClass} resize-none`}
        />
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Date</span>
        <input
          type="date"
          name="event_date"
          required
          defaultValue={event?.event_date}
          className={inputClass}
        />
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">
          Time <span className="text-clay-500">(free text, e.g. &ldquo;6:30 PM&rdquo;)</span>
        </span>
        <input
          name="event_time"
          defaultValue={event?.event_time ?? ""}
          className={inputClass}
          placeholder="6:30 PM"
        />
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Location</span>
        <input
          name="location"
          defaultValue={event?.location ?? ""}
          className={inputClass}
          placeholder="TBD"
        />
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">RSVP link</span>
        <input
          name="rsvp_url"
          type="url"
          defaultValue={event?.rsvp_url ?? ""}
          className={inputClass}
          placeholder="https://…"
        />
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Highlight color</span>
        <select name="highlight" defaultValue={event?.highlight ?? ""} className={inputClass}>
          <option value="">None</option>
          <option value="lavender">Lavender</option>
          <option value="sage">Sage</option>
        </select>
      </label>

      <div className="flex items-center gap-6 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-clay-700">
          <input
            type="checkbox"
            name="date_tbd"
            defaultChecked={event?.date_tbd}
            className="h-4 w-4 rounded border-clay-900/20"
          />
          Date is still TBD
        </label>
        <label className="flex items-center gap-2 text-sm text-clay-700">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={event?.is_published ?? true}
            className="h-4 w-4 rounded border-clay-900/20"
          />
          Published (visible on the live site)
        </label>
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-sage px-6 py-3 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark"
        >
          {event ? "Save changes" : "Create event"}
        </button>
      </div>
    </form>
  );
}
