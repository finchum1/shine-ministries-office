import type { PersonRow } from "@/lib/supabase-types";

const inputClass =
  "w-full rounded-xl border border-clay-900/12 bg-cream px-4 py-3 text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30";

export function PersonForm({
  person,
  action,
}: {
  person?: PersonRow;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Full name</span>
        <input
          name="full_name"
          required
          defaultValue={person?.full_name}
          className={inputClass}
        />
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Email</span>
        <input
          type="email"
          name="email"
          defaultValue={person?.email ?? ""}
          className={inputClass}
        />
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Phone</span>
        <input name="phone" defaultValue={person?.phone ?? ""} className={inputClass} />
      </label>

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-sage px-6 py-3 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:brightness-95"
        >
          {person ? "Save changes" : "Add person"}
        </button>
      </div>
    </form>
  );
}
