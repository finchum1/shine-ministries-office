import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EditDeleteActions } from "@/components/EditDeleteActions";
import { deletePerson } from "./actions";

type PersonWithGroup = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  small_groups: { name: string } | { name: string }[] | null;
};

function groupName(person: PersonWithGroup) {
  const group = Array.isArray(person.small_groups) ? person.small_groups[0] : person.small_groups;
  return group?.name ?? null;
}

export default async function PeoplePage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .select("id, full_name, email, phone, small_groups(name)")
    .order("full_name", { ascending: true });

  const people = (data as PersonWithGroup[] | null) ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-clay-900">People</h1>
          <p className="mt-1 text-sm text-clay-700">
            Everyone tracked for small groups. Organize them into groups from Small Groups.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/people/import"
            className="inline-flex items-center justify-center rounded-full border border-clay-900/15 px-5 py-2.5 text-sm font-medium text-clay-700 transition-colors hover:border-terracotta hover:text-terracotta-dark"
          >
            Add Multiple
          </Link>
          <Link
            href="/people/new"
            className="inline-flex items-center justify-center rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark"
          >
            Add Person
          </Link>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-terracotta-light/30 p-4 text-sm text-terracotta-dark">
          Couldn&rsquo;t load people: {error.message}
        </p>
      )}

      {/* Desktop / wide screens: table. */}
      <div className="mt-8 hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-clay-900/5 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-soft text-xs font-semibold uppercase tracking-wide text-clay-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Small Group</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-clay-900/8">
            {people.map((person) => {
              const group = groupName(person);
              return (
                <tr key={person.id}>
                  <td className="px-5 py-3 font-medium text-clay-900">{person.full_name}</td>
                  <td className="px-5 py-3 text-clay-700">{person.email ?? "—"}</td>
                  <td className="px-5 py-3 text-clay-700">{person.phone ?? "—"}</td>
                  <td className="px-5 py-3">
                    {group ? (
                      <span className="rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-sage-dark">
                        {group}
                      </span>
                    ) : (
                      <span className="rounded-full bg-clay-900/8 px-2.5 py-1 text-xs font-medium text-clay-500">
                        Not in a Group
                      </span>
                    )}
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
              );
            })}
            {people.length === 0 && !error && (
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
        <ul className="divide-y divide-clay-900/8">
          {people.map((person) => {
            const group = groupName(person);
            return (
              <li key={person.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-clay-900">{person.full_name}</p>
                  {group ? (
                    <span className="shrink-0 rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-sage-dark">
                      {group}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-clay-900/8 px-2.5 py-1 text-xs font-medium text-clay-500">
                      Not in a Group
                    </span>
                  )}
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
            );
          })}
          {people.length === 0 && !error && (
            <li className="px-5 py-8 text-center text-clay-500">No people yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
