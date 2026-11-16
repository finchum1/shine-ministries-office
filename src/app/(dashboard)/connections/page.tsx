import { headers } from "next/headers";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { ConnectionsManager, type ActivityRow, type Connection } from "./ConnectionsManager";

export default async function ConnectionsPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  let connections: Connection[] = [];
  let activity: ActivityRow[] = [];
  let loadError: string | null = null;

  if (hasServiceRole()) {
    const db = createAdminClient();
    const [tokens, log] = await Promise.all([
      db
        .from("mcp_tokens")
        .select("id, name, can_write, created_by_email, created_at, last_used_at")
        .is("revoked_at", null)
        .order("created_at", { ascending: false }),
      db
        .from("mcp_activity")
        .select("id, token_name, tool, is_write, ok, summary, created_at")
        .order("created_at", { ascending: false })
        .limit(25),
    ]);
    loadError = tokens.error?.message ?? log.error?.message ?? null;
    connections = (tokens.data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      canWrite: t.can_write,
      createdBy: t.created_by_email,
      createdAt: t.created_at,
      lastUsedAt: t.last_used_at,
    }));
    activity = (log.data ?? []).map((a) => ({
      id: a.id,
      tokenName: a.token_name,
      tool: a.tool,
      isWrite: a.is_write,
      ok: a.ok,
      summary: a.summary,
      createdAt: a.created_at,
    }));
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-clay-900">Connections</h1>
      <p className="mt-1 text-sm text-clay-700">
        Let Claude, Grok or another AI bot work with the back office through MCP.
      </p>

      <div className="mt-6 max-w-3xl">
        {!hasServiceRole() ? (
          <div className="rounded-2xl bg-terracotta-light/30 p-6 text-sm text-clay-900">
            <p className="font-semibold">One-time setup needed</p>
            <p className="mt-2">
              Bot connections need the Supabase <strong>service-role key</strong>. In Supabase, open
              Project Settings &rarr; API and copy the <code>service_role</code> secret. Then in
              Vercel, open this project (shine-ministries-office) &rarr; Settings &rarr; Environment
              Variables and add it as <code>SUPABASE_SERVICE_ROLE_KEY</code>, then redeploy. Keep
              it private &mdash; it bypasses all access rules.
            </p>
          </div>
        ) : (
          <>
            {loadError && (
              <p className="mb-4 rounded-xl bg-terracotta-light/30 p-4 text-sm text-clay-900">
                Couldn&rsquo;t load connections: {loadError}
              </p>
            )}
            <ConnectionsManager origin={origin} connections={connections} activity={activity} />
          </>
        )}
      </div>
    </div>
  );
}
