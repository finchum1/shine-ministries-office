"use client";

import { useMemo, useOptimistic, useRef, useState, useTransition } from "react";

type Person = { id: string; full_name: string };

const inputClass =
  "w-full rounded-xl border border-clay-900/12 bg-cream px-4 py-3 text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30";

export function AttendanceChecklist({
  eventId,
  people,
  presentIds,
  setAttendance,
  addGuest,
}: {
  eventId: string;
  people: Person[];
  presentIds: string[];
  setAttendance: (eventId: string, personId: string, present: boolean) => Promise<void>;
  addGuest: (formData: FormData) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [guestPending, startGuestTransition] = useTransition();
  const guestFormRef = useRef<HTMLFormElement>(null);

  // Optimistic so a tap checks instantly; if the save fails the checkbox
  // snaps back on its own when the transition ends.
  const [optimisticPresent, applyOptimistic] = useOptimistic(
    presentIds,
    (state, change: { id: string; present: boolean }) =>
      change.present
        ? state.includes(change.id)
          ? state
          : [...state, change.id]
        : state.filter((id) => id !== change.id)
  );
  const present = useMemo(() => new Set(optimisticPresent), [optimisticPresent]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? people.filter((p) => p.full_name.toLowerCase().includes(q)) : people;
  }, [people, query]);

  function toggle(personId: string, nextPresent: boolean) {
    setError(null);
    startTransition(async () => {
      applyOptimistic({ id: personId, present: nextPresent });
      try {
        await setAttendance(eventId, personId, nextPresent);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save that change.");
      }
    });
  }

  function submitGuest(formData: FormData) {
    setError(null);
    startGuestTransition(async () => {
      try {
        await addGuest(formData);
        guestFormRef.current?.reset();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't add that person.");
      }
    });
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg text-clay-900">Who was there</h2>
          <p className="text-sm font-semibold text-clay-900" aria-live="polite">
            {present.size} attended
          </p>
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search names"
          aria-label="Search names"
          className={`${inputClass} mt-4`}
        />

        {error && (
          <p className="mt-3 rounded-xl bg-terracotta-light/30 p-3 text-sm text-clay-900">
            {error}
          </p>
        )}

        <ul className="mt-4 divide-y divide-clay-900/8">
          {filtered.map((person) => {
            const checked = present.has(person.id);
            return (
              <li key={person.id}>
                <label className="flex cursor-pointer items-center gap-3 py-3 text-sm text-clay-900">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggle(person.id, e.target.checked)}
                    className="h-5 w-5 rounded border-clay-900/30 text-sage focus:ring-sage"
                  />
                  <span className={checked ? "font-medium" : "text-clay-700"}>
                    {person.full_name}
                  </span>
                </label>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="py-3 text-sm text-clay-500">
              {people.length === 0
                ? "No one in the People Directory yet."
                : "No one matches that search -- add them as a new guest."}
            </li>
          )}
        </ul>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5">
        <h2 className="font-display text-lg text-clay-900">New guest</h2>
        <p className="mt-1 text-sm text-clay-700">
          Someone who isn&rsquo;t in the directory yet. They&rsquo;re added to People and marked
          as attended.
        </p>
        <form ref={guestFormRef} action={submitGuest} className="mt-4 grid gap-3">
          <input name="full_name" required placeholder="Full name" className={inputClass} />
          <input name="email" type="email" placeholder="Email (optional)" className={inputClass} />
          <input name="phone" placeholder="Phone (optional)" className={inputClass} />
          <div>
            <button
              type="submit"
              disabled={guestPending}
              className="rounded-full bg-sage px-6 py-3 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:brightness-95 disabled:opacity-60"
            >
              {guestPending ? "Adding…" : "Add & mark attended"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
