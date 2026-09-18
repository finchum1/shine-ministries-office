import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PeopleDirectory } from "@/components/PeopleDirectory";
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
    // Two foreign keys connect people <-> small_groups (this one, plus
    // small_groups.leader_id -> people the other way), so PostgREST can't
    // infer which relationship to embed without an explicit hint -- without
    // it, this query fails outright with an "ambiguous relationship" error.
    .select("id, full_name, email, phone, small_groups!people_small_group_id_fkey(name)")
    .order("full_name", { ascending: true });

  const people = ((data as PersonWithGroup[] | null) ?? []).map((person) => ({
    id: person.id,
    full_name: person.full_name,
    email: person.email,
    phone: person.phone,
    group: groupName(person),
  }));

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

      <PeopleDirectory people={people} deletePerson={deletePerson} />
    </div>
  );
}
