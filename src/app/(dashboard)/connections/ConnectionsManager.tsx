"use client";

import { useActionState } from "react";
import { createConnection, revokeConnection, type ConnectionState } from "./actions";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { CopyLinkButton } from "@/components/CopyLinkButton";

export type Connection = {
  id: string;
  name: string;
  canWrite: boolean;
  createdBy: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

export type ActivityRow = {
  id: number;
  tokenName: string;
  tool: string;
  isWrite: boolean;
  ok: boolean;
  summary: string | null;
  createdAt: string;
};

const inputClass =
  "w-full rounded-xl border border-clay-900/12 bg-cream px-4 py-3 text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function Snippet({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-clay-500">{label}</p>
        <CopyLinkButton url={text} label="Copy" />
      </div>
      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-white p-3 font-mono text-xs text-clay-900">
        {text}
      </pre>
    </div>
  );
}

function IssuedToken({ issued, origin }: { issued: NonNullable<ConnectionState>["issued"]; origin: string }) {
  if (!issued) return null;
  const { name, token, canWrite } = issued;
  return (
    <div className="mt-5 rounded-xl bg-sage/15 p-4 text-sm text-clay-900">
      <p className="font-semibold">
        “{name}” is ready ({canWrite ? "can read and make safe changes" : "read-only"})
      </p>
      <p className="mt-2">
        Copy what you need now. The token is shown only this once; if you lose it, make a new
        connection and revoke this one.
      </p>
      <Snippet label="Token" text={token} />
      <Snippet
        label="Claude Code (terminal)"
        text={`claude mcp add --transport http shine-office ${origin}/mcp --header "Authorization: Bearer ${token}"`}
      />
      <Snippet label="Connector that only takes a URL (claude.ai, Grok, others)" text={`${origin}/mcp/${token}`} />
      <p className="mt-3 text-xs text-clay-700">
        For anything that has a header or API-key field, use <code>{origin}/mcp</code> with{" "}
        <code>Authorization: Bearer &lt;token&gt;</code>. The URL form puts the secret in the
        address, so treat the whole URL like a password.
      </p>
    </div>
  );
}

export function ConnectionsManager({
  origin,
  connections,
  activity,
}: {
  origin: string;
  connections: Connection[];
  activity: ActivityRow[];
}) {
  const [state, formAction, pending] = useActionState(createConnection, null as ConnectionState);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <h2 className="font-display text-lg text-clay-900">Connect a bot</h2>
        <p className="mt-1 text-sm text-clay-700">
          Make one connection per bot so you can see what each did and turn one off without
          affecting the others.
        </p>
        <form action={formAction} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-clay-700" htmlFor="name">
              Name
            </label>
            <input id="name" name="name" required maxLength={60} className={inputClass} placeholder="Claude, Grok bot, …" />
          </div>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-clay-700">What it may do</legend>
            <label className="flex items-start gap-3 py-1 text-sm text-clay-900">
              <input type="radio" name="access" value="read" defaultChecked className="mt-1" />
              <span>
                <strong>Read only</strong> &mdash; look things up, change nothing.
              </span>
            </label>
            <label className="flex items-start gap-3 py-1 text-sm text-clay-900">
              <input type="radio" name="access" value="write" className="mt-1" />
              <span>
                <strong>Read + safe changes</strong> &mdash; also add draft events, add or edit
                people, add people to small groups, record headcounts. Never publishes, deletes, or
                touches merch or payments.
              </span>
            </label>
          </fieldset>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-full bg-sage px-6 py-3 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:brightness-95 disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create connection"}
          </button>
        </form>
        {state?.error && <p className="mt-4 text-sm text-clay-900">{state.error}</p>}
        <IssuedToken issued={state?.issued} origin={origin} />
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <h2 className="font-display text-lg text-clay-900">Active connections</h2>
        {connections.length === 0 ? (
          <p className="mt-3 text-sm text-clay-500">No bots connected yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-clay-900/8">
            {connections.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-clay-900">
                    {c.name}
                    <span className="ml-2 rounded-full bg-clay-900/8 px-2 py-0.5 text-xs font-semibold text-clay-700">
                      {c.canWrite ? "Read + safe changes" : "Read only"}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-clay-500">
                    Created {when(c.createdAt)}
                    {c.createdBy ? ` by ${c.createdBy}` : ""} ·{" "}
                    {c.lastUsedAt ? `last used ${when(c.lastUsedAt)}` : "never used"}
                  </p>
                </div>
                <ConfirmDeleteButton deleteAction={revokeConnection.bind(null, c.id)} itemLabel="connection (it stops working immediately)" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <h2 className="font-display text-lg text-clay-900">Recent bot activity</h2>
        {activity.length === 0 ? (
          <p className="mt-3 text-sm text-clay-500">Nothing yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-clay-900/8 text-sm">
            {activity.map((a) => (
              <li key={a.id} className="py-2.5">
                <p className="text-clay-900">
                  <span className="font-medium">{a.tokenName}</span> &middot; {a.tool}
                  {a.isWrite && (
                    <span className="ml-2 rounded-full bg-terracotta-light/40 px-2 py-0.5 text-xs font-semibold">
                      change
                    </span>
                  )}
                  {!a.ok && <span className="ml-2 text-xs text-clay-500">(didn&rsquo;t go through)</span>}
                </p>
                <p className="text-xs text-clay-500">
                  {when(a.createdAt)}
                  {a.summary ? ` · ${a.summary}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
