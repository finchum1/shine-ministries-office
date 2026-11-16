import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { TeamManager, type TeamMember } from "./TeamManager";

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let members: TeamMember[] = [];
  let loadError: string | null = null;

  if (hasServiceRole()) {
    const { data, error } = await createAdminClient().auth.admin.listUsers({ perPage: 200 });
    if (error) loadError = error.message;
    members = (data?.users ?? [])
      .map((u) => ({
        id: u.id,
        email: u.email ?? "",
        fullName: (u.user_metadata?.full_name as string | undefined) ?? null,
        lastSignIn: u.last_sign_in_at ?? null,
        isYou: u.id === user?.id,
      }))
      .sort((a, b) => a.email.localeCompare(b.email));
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-clay-900">Team</h1>
      <p className="mt-1 text-sm text-clay-700">Who can sign in to this back office.</p>

      <div className="mt-6 max-w-3xl">
        {!hasServiceRole() ? (
          <div className="rounded-2xl bg-terracotta-light/30 p-6 text-sm text-clay-900">
            <p className="font-semibold">One-time setup needed</p>
            <p className="mt-2">
              Managing logins needs the Supabase <strong>service-role key</strong>. In Supabase,
              open Project Settings &rarr; API and copy the <code>service_role</code> secret. Then
              in Vercel, open this project (shine-ministries-office) &rarr; Settings &rarr;
              Environment Variables and add it as <code>SUPABASE_SERVICE_ROLE_KEY</code>, then
              redeploy. Keep it private &mdash; it bypasses all access rules.
            </p>
          </div>
        ) : (
          <>
            {loadError && (
              <p className="mb-4 rounded-xl bg-terracotta-light/30 p-4 text-sm text-clay-900">
                Couldn&rsquo;t load logins: {loadError}
              </p>
            )}
            <TeamManager members={members} />
          </>
        )}
      </div>
    </div>
  );
}
