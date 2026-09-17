import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PersonRow, SmallGroupRow } from "@/lib/supabase-types";
import { updateSmallGroupDetails, setLeader, addMembers, removeMember } from "../actions";

const inputClass =
  "w-full rounded-xl border border-clay-900/12 bg-cream px-4 py-3 text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30";

export default async function ManageSmallGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: groupData }, { data: peopleData }] = await Promise.all([
    supabase.from("small_groups").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("people")
      .select("id, full_name, email, phone, small_group_id, created_at")
      .order("full_name", { ascending: true }),
  ]);

  if (!groupData) notFound();

  const group = groupData as SmallGroupRow;
  const people = (peopleData as PersonRow[] | null) ?? [];
  const members = people.filter((p) => p.small_group_id === group.id);
  const unassigned = people.filter((p) => !p.small_group_id);

  return (
    <div>
      <h1 className="font-display text-2xl text-clay-900">{group.name}</h1>
      <p className="mt-1 text-sm text-clay-700">
        Set the leader, and add or remove people from this group.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5">
          <h2 className="font-display text-lg text-clay-900">Details</h2>
          <form action={updateSmallGroupDetails.bind(null, group.id)} className="mt-4 grid gap-4">
            <label>
              <span className="mb-1.5 block text-sm font-medium text-clay-700">Group name</span>
              <input name="name" required defaultValue={group.name} className={inputClass} />
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-medium text-clay-700">Description</span>
              <textarea
                name="description"
                rows={3}
                defaultValue={group.notes ?? ""}
                placeholder="What this group is about"
                className={`${inputClass} resize-none`}
              />
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-medium text-clay-700">Where</span>
              <input
                name="location"
                defaultValue={group.location ?? ""}
                placeholder="e.g. The Smiths' house"
                className={inputClass}
              />
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-medium text-clay-700">Frequency</span>
              <input
                name="frequency"
                defaultValue={group.frequency ?? ""}
                placeholder="e.g. Every other Monday, 6:30 PM"
                className={inputClass}
              />
            </label>

            <div>
              <button
                type="submit"
                className="rounded-full bg-sage px-6 py-3 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark"
              >
                Save details
              </button>
            </div>
          </form>

          <h2 className="mt-8 font-display text-lg text-clay-900">Leader</h2>
          <form action={setLeader.bind(null, group.id)} className="mt-4 flex gap-3">
            <select
              name="leader_id"
              defaultValue={group.leader_id ?? ""}
              className={inputClass}
            >
              <option value="">No leader set</option>
              {members.length > 0 && (
                <optgroup label="Current members">
                  {members.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.full_name}
                    </option>
                  ))}
                </optgroup>
              )}
              {unassigned.length > 0 && (
                <optgroup label="Not in a group yet">
                  {unassigned.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.full_name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <button
              type="submit"
              className="shrink-0 rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark"
            >
              Save
            </button>
          </form>
          <p className="mt-2 text-xs text-clay-500">
            Picking someone from &ldquo;Not in a group yet&rdquo; adds them to this group too.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5">
          <h2 className="font-display text-lg text-clay-900">Members ({members.length})</h2>
          <ul className="mt-4 divide-y divide-clay-900/8">
            {members.map((person) => (
              <li key={person.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-sm text-clay-900">
                  {person.full_name}
                  {person.id === group.leader_id && (
                    <span className="ml-1.5 text-xs font-semibold text-terracotta-dark">
                      (Leader)
                    </span>
                  )}
                </span>
                <form action={removeMember.bind(null, group.id, person.id)}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-clay-500 hover:text-terracotta-dark"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
            {members.length === 0 && (
              <li className="py-2.5 text-sm text-clay-500">No members yet.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5">
        <h2 className="font-display text-lg text-clay-900">
          Add members ({unassigned.length} not in a group)
        </h2>
        <form action={addMembers.bind(null, group.id)} className="mt-4">
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
                Everyone is already placed in a group.
              </p>
            )}
          </div>
          {unassigned.length > 0 && (
            <button
              type="submit"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-sage px-6 py-3 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark"
            >
              Add selected
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
