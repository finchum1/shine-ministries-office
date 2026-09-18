"use client";

import { useMemo, useState } from "react";
import { EditDeleteActions } from "@/components/EditDeleteActions";

export type PersonWithGroupName = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  group: string | null;
};

function GroupBadge({ group }: { group: string | null }) {
  return group ? (
    <span className="rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-sage-dark">
      {group}
    </span>
  ) : (
    <span className="rounded-full bg-clay-900/8 px-2.5 py-1 text-xs font-medium text-clay-500">
      Not in a Group
    </span>
  );
}

export function PeopleDirectory({
  people,
  deletePerson,
}: {
  people: PersonWithGroupName[];
  deletePerson: (id: string) => Promise<void>;
}) {
  // Off by default: plain alphabetical-by-name, same as before this existed.
  const [sortByGroup, setSortByGroup] = useState(false);
  const [groupDesc, setGroupDesc] = useState(false);

  const sorted = useMemo(() => {
    if (!sortByGroup) {
      return [...people].sort((a, b) => a.full_name.localeCompare(b.full_name));
    }
    // Unassigned people sort to the end regardless of direction -- the point
    // of this sort is clustering group-mates together, not burying them.
    const dir = groupDesc ? -1 : 1;
    return [...people].sort((a, b) => {
      if (!a.group && !b.group) return a.full_name.localeCompare(b.full_name);
      if (!a.group) return 1;
      if (!b.group) return -1;
      const byGroup = a.group.localeCompare(b.group) * dir;
      return byGroup !== 0 ? byGroup : a.full_name.localeCompare(b.full_name);
    });
  }, [people, sortByGroup, groupDesc]);

  function toggleGroupSort() {
    if (!sortByGroup) {
      setSortByGroup(true);
      setGroupDesc(false);
    } else {
      setGroupDesc((d) => !d);
    }
  }

  return (
    <>
      {/* Desktop / wide screens: table. */}
      <div className="mt-8 hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-clay-900/5 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-soft text-xs font-semibold uppercase tracking-wide text-clay-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">
                <button
                  type="button"
                  onClick={toggleGroupSort}
                  className="inline-flex items-center gap-1 uppercase tracking-wide text-clay-500 transition-colors hover:text-terracotta-dark"
                >
                  Small Group
                  <span className="text-[10px] leading-none">
                    {sortByGroup ? (groupDesc ? "▼" : "▲") : "↕"}
                  </span>
                </button>
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-clay-900/8">
            {sorted.map((person) => (
              <tr key={person.id}>
                <td className="px-5 py-3 font-medium text-clay-900">{person.full_name}</td>
                <td className="px-5 py-3 text-clay-700">{person.email ?? "—"}</td>
                <td className="px-5 py-3 text-clay-700">{person.phone ?? "—"}</td>
                <td className="px-5 py-3">
                  <GroupBadge group={person.group} />
                </td>
                <td className="px-5 py-3 text-right">
                  <EditDeleteActions
                    editHref={`/people/${person.id}`}
                    deleteAction={deletePerson.bind(null, person.id)}
                    itemLabel="person"
                    variant="table"
                  />
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-clay-500">
                  No people yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Small screens: cards. */}
      <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-clay-900/5 md:hidden">
        <div className="flex items-center justify-end border-b border-clay-900/8 px-4 py-2.5">
          <button
            type="button"
            onClick={toggleGroupSort}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-clay-500 transition-colors hover:text-terracotta-dark"
          >
            Sort by Small Group
            <span className="text-[10px] leading-none">
              {sortByGroup ? (groupDesc ? "▼" : "▲") : "↕"}
            </span>
          </button>
        </div>
        <ul className="divide-y divide-clay-900/8">
          {sorted.map((person) => (
            <li key={person.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-clay-900">{person.full_name}</p>
                <GroupBadge group={person.group} />
              </div>
              {(person.email || person.phone) && (
                <p className="mt-1 text-sm text-clay-700">
                  {[person.email, person.phone].filter(Boolean).join(" · ")}
                </p>
              )}
              <EditDeleteActions
                editHref={`/people/${person.id}`}
                deleteAction={deletePerson.bind(null, person.id)}
                itemLabel="person"
                variant="card"
              />
            </li>
          ))}
          {sorted.length === 0 && (
            <li className="px-5 py-8 text-center text-clay-500">No people yet.</li>
          )}
        </ul>
      </div>
    </>
  );
}
