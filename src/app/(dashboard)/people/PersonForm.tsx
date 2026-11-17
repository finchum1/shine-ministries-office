import type { PersonRow } from "@/lib/supabase-types";
import { FormButtons } from "@/components/FormButtons";
import { MONTHS } from "@/lib/birthday";

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

      <fieldset className="sm:col-span-2">
        <legend className="mb-1.5 block text-sm font-medium text-clay-700">
          Birthday <span className="font-normal text-clay-500">(year is optional)</span>
        </legend>
        <div className="grid grid-cols-[1fr_5.5rem_6.5rem] gap-3">
          <select
            name="birth_month"
            aria-label="Birth month"
            defaultValue={person?.birth_month ?? ""}
            className={inputClass}
          >
            <option value="">Month</option>
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            name="birth_day"
            aria-label="Birth day"
            defaultValue={person?.birth_day ?? ""}
            className={inputClass}
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <input
            name="birth_year"
            type="number"
            inputMode="numeric"
            min={1900}
            max={2100}
            placeholder="Year"
            aria-label="Birth year"
            defaultValue={person?.birth_year ?? ""}
            className={inputClass}
          />
        </div>
      </fieldset>

      <FormButtons
        submitLabel={person ? "Save changes" : "Add person"}
        cancelHref="/people"
        className="sm:col-span-2"
      />
    </form>
  );
}
