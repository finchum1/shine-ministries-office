import { createClient } from "@/lib/supabase/server";
import type { PersonRow } from "@/lib/supabase-types";
import { createSmallGroup } from "../actions";

const inputClass =
  "w-full rounded-xl border border-clay-900/12 bg-cream px-4 py-3 text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30";

export default async function NewSmallGroupPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("people")
    .select("id, full_name")
    .is("small_group_id", null)
    .order("full_name", { ascending: true });

  const unassigned = (data as Pick<PersonRow, "id" | "full_name">[] | null) ?? [];

  return (
    <div>
      <h1 className="font-display text-2xl text-clay-900">New Small Group</h1>
      <p className="mt-1 text-sm text-clay-700">
        Name the group and add its first members. You can set a leader and add more people once
        it&rsquo;s created.
      </p>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <form action={createSmallGroup} className="grid gap-5">
          <label>
            <span className="mb-1.5 block text-sm font-medium text-clay-700">Group name</span>
            <input name="name" required className={inputClass} placeholder="e.g. Tuesday Night" />
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-clay-700">
              Leader (optional)
            </span>
            <select name="leader_id" defaultValue="" className={inputClass}>
              <option value="">No leader yet</option>
              {unassigned.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name}
                </option>
              ))}
            </select>
            <span className="mt-1.5 block text-xs text-clay-500">
              Picking a leader adds them to the group -- you can create it with just them in it
              and add everyone else later.
            </span>
          </label>

          <div>
            <span className="mb-2 block text-sm font-medium text-clay-700">
              Add members ({unassigned.length} not in a group)
            </span>
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-clay-900/12 bg-cream p-3">
              {unassigned.map((person) => (
                <label
                  key={person.id}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-clay-700 hover:bg-clay-900/5"
                >
                  <input
                    type="checkbox"
                    name="memberIds"
                    value={person.id}
                    className="h-4 w-4 rounded border-clay-900/30 text-sage focus:ring-sage"
                  />
                  {person.full_name}
                </label>
              ))}
              {unassigned.length === 0 && (
                <p className="px-2 py-1.5 text-sm text-clay-500">
                  No one is unassigned right now -- you can add members later.
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-sage px-6 py-3 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark"
            >
              Create group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
