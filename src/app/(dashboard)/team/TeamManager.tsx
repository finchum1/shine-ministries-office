"use client";

import { useActionState } from "react";
import { addMember, resetMemberPassword, removeMember, type TeamState } from "./actions";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { CopyLinkButton } from "@/components/CopyLinkButton";

export type TeamMember = {
  id: string;
  email: string;
  fullName: string | null;
  lastSignIn: string | null;
  isYou: boolean;
};

const inputClass =
  "w-full rounded-xl border border-clay-900/12 bg-cream px-4 py-3 text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30";

function IssuedPassword({ state }: { state: TeamState }) {
  if (!state?.issued) return null;
  const { email, password, kind } = state.issued;
  return (
    <div className="mt-5 rounded-xl bg-sage/15 p-4 text-sm text-clay-900">
      <p className="font-semibold">
        {kind === "new" ? "Login created" : "New password set"} for {email}
      </p>
      <p className="mt-2">
        Send them this temporary password. It is shown only now, so copy it before leaving the
        page. They can change it under Settings after they sign in.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <code className="rounded-lg bg-white px-3 py-2 font-mono text-base tracking-wide">
          {password}
        </code>
        <CopyLinkButton url={password} label="Copy password" />
      </div>
    </div>
  );
}

function ResetButton({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(resetMemberPassword, null as TeamState);
  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="user_id" value={userId} />
        <button
          type="submit"
          disabled={pending}
          className="text-sm font-medium text-clay-500 hover:text-clay-900 disabled:opacity-60"
        >
          {pending ? "Resetting…" : "Reset password"}
        </button>
      </form>
      {state?.error && <p className="mt-1 text-xs text-clay-900">{state.error}</p>}
      <IssuedPassword state={state} />
    </div>
  );
}

export function TeamManager({ members }: { members: TeamMember[] }) {
  const [state, formAction, pending] = useActionState(addMember, null as TeamState);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <h2 className="font-display text-lg text-clay-900">Add a login</h2>
        <p className="mt-1 text-sm text-clay-700">
          They get full access to the back office. You&rsquo;ll see a temporary password once to
          pass along.
        </p>
        <form action={formAction} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-clay-700" htmlFor="full_name">
              Name
            </label>
            <input id="full_name" name="full_name" className={inputClass} placeholder="Jane Smith" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-clay-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={inputClass}
              placeholder="jane@example.com"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center rounded-full bg-sage px-6 py-3 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:brightness-95 disabled:opacity-60"
            >
              {pending ? "Adding…" : "Add login"}
            </button>
          </div>
        </form>
        {state?.error && <p className="mt-4 text-sm text-clay-900">{state.error}</p>}
        <IssuedPassword state={state} />
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <h2 className="font-display text-lg text-clay-900">Current logins</h2>
        <ul className="mt-4 divide-y divide-clay-900/8">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-clay-900">
                  {m.fullName ? `${m.fullName} · ` : ""}
                  {m.email}
                  {m.isYou && <span className="ml-2 text-xs text-clay-500">(you)</span>}
                </p>
                <p className="mt-0.5 text-xs text-clay-500">
                  {m.lastSignIn
                    ? `Last signed in ${new Date(m.lastSignIn).toLocaleDateString("en-US", {
                        timeZone: "America/Chicago",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}`
                    : "Hasn’t signed in yet"}
                </p>
              </div>
              {!m.isYou && (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-4">
                    <ResetButton userId={m.id} />
                    <ConfirmDeleteButton
                      deleteAction={removeMember.bind(null, m.id)}
                      itemLabel="login"
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
