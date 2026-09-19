import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { PersonRow, SmallGroupRow } from "@/lib/supabase-types";
import { SmallGroupsBoard } from "@/components/SmallGroupsBoard";

export default async function SmallGroupsPage() {
  const supabase = await createClient();
  const [{ data: groupsData, error: groupsError }, { data: peopleData, error: peopleError }] =
    await Promise.all([
      supabase.from("small_groups").select("*").order("sort_order", { ascending: true }),
      supabase
        .from("people")
        .select("id, full_name, email, phone, small_group_id, created_at")
        .order("full_name", { ascending: true }),
    ]);

  const groups = (groupsData as SmallGroupRow[] | null) ?? [];
  const people = (peopleData as PersonRow[] | null) ?? [];
  const error = groupsError ?? peopleError;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-clay-900">Small Groups</h1>
          <p className="mt-1 text-sm text-clay-700">
            Drag a name from &ldquo;Not in a Group&rdquo; onto a group to place them, or drag a
            group&rsquo;s ⠿ handle to reorder. Manage a group to rename it or delete it --
            deleting returns its people to &ldquo;Not in a Group.&rdquo;
          </p>
        </div>
        <Link
          href="/small-groups/new"
          className="inline-flex items-center justify-center rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:brightness-95"
        >
          New Small Group
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-terracotta-light/30 p-4 text-sm text-clay-900">
          Couldn&rsquo;t load small groups: {error.message}
        </p>
      )}

      <SmallGroupsBoard initialGroups={groups} initialPeople={people} />
    </div>
  );
}
