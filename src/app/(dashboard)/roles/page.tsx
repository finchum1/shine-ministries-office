import { createClient } from "@/lib/supabase/server";
import type { LeadershipRoleRow } from "@/lib/supabase-types";
import { RolesBoard } from "@/components/RolesBoard";

export default async function RolesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leadership_roles")
    .select("*")
    .order("sort_order", { ascending: true });

  const roles = (data as LeadershipRoleRow[] | null) ?? [];

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl text-clay-900">Roles</h1>
        <p className="mt-1 text-sm text-clay-700">
          Leadership role descriptions. Click a role to view, edit, or print it on letterhead.
        </p>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-terracotta-light/30 p-4 text-sm text-clay-900">
          Couldn&rsquo;t load roles: {error.message}
        </p>
      )}

      <RolesBoard initialRoles={roles} />
    </div>
  );
}
