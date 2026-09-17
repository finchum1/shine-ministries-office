import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { PersonRow, SmallGroupRow } from "@/lib/supabase-types";
import { EditDeleteActions } from "@/components/EditDeleteActions";
import { deleteSmallGroup } from "./actions";

export default async function SmallGroupsPage() {
  const supabase = await createClient();
  const [{ data: groupsData, error: groupsError }, { data: peopleData, error: peopleError }] =
    await Promise.all([
      supabase.from("small_groups").select("*").order("name", { ascending: true }),
      supabase
        .from("people")
        .select("id, full_name, email, phone, small_group_id, created_at")
        .order("full_name", { ascending: true }),
    ]);

  const groups = (groupsData as SmallGroupRow[] | null) ?? [];
  const people = (peopleData as PersonRow[] | null) ?? [];
  const error = groupsError ?? peopleError;

  const unassigned = people.filter((p) => !p.small_group_id);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-clay-900">Small Groups</h1>
          <p className="mt-1 text-sm text-clay-700">
            Who&rsquo;s in each group, and who still needs to be placed. Deleting a group returns
            its people to &ldquo;Not in a Group.&rdquo;
          </p>
        </div>
        <Link
          href="/small-groups/new"
          className="inline-flex items-center justify-center rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark"
        >
          New Small Group
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-terracotta-light/30 p-4 text-sm text-terracotta-dark">
          Couldn&rsquo;t load small groups: {error.message}
        </p>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* The "shadow box" for everyone not yet placed in a group. */}
        <div className="rounded-2xl bg-cream-soft p-5 shadow-sm ring-1 ring-clay-900/5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg text-clay-900">Not in a Group</h2>
            <span className="shrink-0 rounded-full bg-clay-900/8 px-2.5 py-1 text-xs font-medium text-clay-500">
              {unassigned.length}
            </span>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-clay-700">
            {unassigned.map((person) => (
              <li key={person.id}>{person.full_name}</li>
            ))}
            {unassigned.length === 0 && (
              <li className="text-clay-500">Everyone has a small group.</li>
            )}
          </ul>
        </div>

        {groups.map((group) => {
          const members = people.filter((p) => p.small_group_id === group.id);
          const leader = members.find((p) => p.id === group.leader_id);

          return (
            <div key={group.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-clay-900/5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg text-clay-900">{group.name}</h2>
                <span className="shrink-0 rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-sage-dark">
                  {members.length}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-terracotta-dark">
                Leader: {leader ? leader.full_name : "Not set"}
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-clay-700">
                {members.map((person) => (
                  <li key={person.id}>
                    {person.full_name}
                    {person.id === group.leader_id && (
                      <span className="ml-1.5 text-xs font-semibold text-terracotta-dark">
                        (Leader)
                      </span>
                    )}
                  </li>
                ))}
                {members.length === 0 && <li className="text-clay-500">No members yet.</li>}
              </ul>

              <EditDeleteActions
                editHref={`/small-groups/${group.id}`}
                deleteAction={deleteSmallGroup.bind(null, group.id)}
                itemLabel="small group"
                variant="card"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
