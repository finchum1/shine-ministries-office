"use client";

import { useMemo, useState } from "react";
import { EditDeleteActions } from "@/components/EditDeleteActions";
import { daysUntilBirthday, formatBirthday } from "@/lib/birthday";

export type PersonWithGroupName = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_month: number | null;
  birth_day: number | null;
  birth_year: number | null;
  groups: string[];
};

type SortMode = "name" | "group" | "birthday";

function birthdayOf(p: PersonWithGroupName) {
  return { month: p.birth_month, day: p.birth_day, year: p.birth_year };
}

function untilLabel(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
}

function GroupBadges({ groups }: { groups: string[] }) {
  if (groups.length === 0) {
    return (
      <span className="rounded-full bg-clay-900/8 px-2.5 py-1 text-xs font-medium text-clay-500">
        Not in a Group
      </span>
    );
  }
  return (
    <span className="flex flex-wrap gap-1">
      {groups.map((group) => (
        <span
          key={group}
          className="rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-clay-900"
        >
          {group}
        </span>
      ))}
    </span>
  );
}

export function PeopleDirectory({
  people,
  deletePerson,
  todayIso,
}: {
  people: PersonWithGroupName[];
  deletePerson: (id: string) => Promise<void>;
  todayIso: string;
}) {
  // Defaults to plain alphabetical-by-name, same as before either sort
  // existed. Clicking "Name" always gets back here.
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [desc, setDesc] = useState(false);

  const sorted = useMemo(() => {
    const dir = desc ? -1 : 1;
    if (sortMode === "name") {
      return [...people].sort((a, b) => a.full_name.localeCompare(b.full_name) * dir);
    }
    if (sortMode === "birthday") {
      // Next birthday first; people with none on file always sink to the end.
      return [...people].sort((a, b) => {
        const da = daysUntilBirthday(birthdayOf(a), todayIso);
        const db = daysUntilBirthday(birthdayOf(b), todayIso);
        if (da === null && db === null) return a.full_name.localeCompare(b.full_name);
        if (da === null) return 1;
        if (db === null) return -1;
        return (da - db) * dir || a.full_name.localeCompare(b.full_name);
      });
    }
    // Unassigned people sort to the end regardless of direction -- the point
    // of this sort is clustering group-mates together, not burying them.
    // Someone in multiple groups sorts by the first (alphabetically) one.
    return [...people].sort((a, b) => {
      const aGroup = a.groups[0] ?? null;
      const bGroup = b.groups[0] ?? null;
      if (!aGroup && !bGroup) return a.full_name.localeCompare(b.full_name);
      if (!aGroup) return 1;
      if (!bGroup) return -1;
      const byGroup = aGroup.localeCompare(bGroup) * dir;
      return byGroup !== 0 ? byGroup : a.full_name.localeCompare(b.full_name);
    });
  }, [people, sortMode, desc, todayIso]);

  // Anyone with a birthday in the next 30 days, soonest first.
  const upcoming = useMemo(
    () =>
      people
        .map((p) => ({ p, days: daysUntilBirthday(birthdayOf(p), todayIso) }))
        .filter((x): x is { p: PersonWithGroupName; days: number } => x.days !== null && x.days <= 30)
        .sort((a, b) => a.days - b.days || a.p.full_name.localeCompare(b.p.full_name)),
    [people, todayIso]
  );

  function clickSort(mode: SortMode) {
    if (sortMode === mode) {
      setDesc((d) => !d);
    } else {
      setSortMode(mode);
      setDesc(false);
    }
  }

  function sortIndicator(mode: SortMode) {
    return sortMode === mode ? (desc ? "▼" : "▲") : "↕";
  }

  return (
    <>
      {upcoming.length > 0 && (
        <div className="mt-8 rounded-2xl bg-terracotta-light/30 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-clay-700">
            Birthdays in the next 30 days
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-clay-900">
            {upcoming.map(({ p, days }) => (
              <li key={p.id}>
                <span className="font-medium">{p.full_name}</span>{" "}
                <span className="text-clay-700">
                  {formatBirthday({ ...birthdayOf(p), year: null }, true)} &middot; {untilLabel(days)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Desktop / wide screens: table. */}
      <div className="mt-6 hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-clay-900/5 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-soft text-xs font-semibold uppercase tracking-wide text-clay-500">
            <tr>
              <th className="px-5 py-3">
                <button
                  type="button"
                  onClick={() => clickSort("name")}
                  className="inline-flex items-center gap-1 uppercase tracking-wide text-clay-500 transition-colors hover:text-clay-900"
                >
                  Name
                  <span className="text-[10px] leading-none">{sortIndicator("name")}</span>
                </button>
              </th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">
                <button
                  type="button"
                  onClick={() => clickSort("birthday")}
                  className="inline-flex items-center gap-1 uppercase tracking-wide text-clay-500 transition-colors hover:text-clay-900"
                >
                  Birthday
                  <span className="text-[10px] leading-none">{sortIndicator("birthday")}</span>
                </button>
              </th>
              <th className="px-5 py-3">
                <button
                  type="button"
                  onClick={() => clickSort("group")}
                  className="inline-flex items-center gap-1 uppercase tracking-wide text-clay-500 transition-colors hover:text-clay-900"
                >
                  Small Group
                  <span className="text-[10px] leading-none">{sortIndicator("group")}</span>
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
                <td className="px-5 py-3 text-clay-700">
                  {formatBirthday(birthdayOf(person), true) ?? "—"}
                </td>
                <td className="px-5 py-3">
                  <GroupBadges groups={person.groups} />
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
                <td colSpan={6} className="px-5 py-8 text-center text-clay-500">
                  No people yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Small screens: cards. */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-clay-900/5 md:hidden">
        <div className="flex items-center justify-end gap-4 border-b border-clay-900/8 px-4 py-2.5">
          <button
            type="button"
            onClick={() => clickSort("name")}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-clay-500 transition-colors hover:text-clay-900"
          >
            Name
            <span className="text-[10px] leading-none">{sortIndicator("name")}</span>
          </button>
          <button
            type="button"
            onClick={() => clickSort("group")}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-clay-500 transition-colors hover:text-clay-900"
          >
            Small Group
            <span className="text-[10px] leading-none">{sortIndicator("group")}</span>
          </button>
          <button
            type="button"
            onClick={() => clickSort("birthday")}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-clay-500 transition-colors hover:text-clay-900"
          >
            Birthday
            <span className="text-[10px] leading-none">{sortIndicator("birthday")}</span>
          </button>
        </div>
        <ul className="divide-y divide-clay-900/8">
          {sorted.map((person) => (
            <li key={person.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-clay-900">{person.full_name}</p>
                <GroupBadges groups={person.groups} />
              </div>
              {(person.email || person.phone || person.birth_month) && (
                <p className="mt-1 text-sm text-clay-700">
                  {[person.email, person.phone, formatBirthday(birthdayOf(person), true)]
                    .filter(Boolean)
                    .join(" · ")}
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
