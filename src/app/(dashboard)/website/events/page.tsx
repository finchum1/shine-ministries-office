import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { EventRow } from "@/lib/supabase-types";
import { deleteEvent } from "./actions";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  const events = (data as EventRow[] | null) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-clay-900">Events</h1>
          <p className="mt-1 text-sm text-clay-700">
            What shows up on the homepage and /events page.
          </p>
        </div>
        <Link
          href="/website/events/new"
          className="inline-flex items-center justify-center rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark"
        >
          New Event
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-terracotta-light/30 p-4 text-sm text-terracotta-dark">
          Couldn&rsquo;t load events: {error.message}
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-clay-900/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-soft text-xs font-semibold uppercase tracking-wide text-clay-500">
            <tr>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Highlight</th>
              <th className="px-5 py-3">Published</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-clay-900/8">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="px-5 py-3 font-medium text-clay-900">{event.title}</td>
                <td className="px-5 py-3 text-clay-700">
                  {event.event_date}
                  {event.date_tbd ? " (TBD)" : ""}
                </td>
                <td className="px-5 py-3 text-clay-700 capitalize">{event.highlight ?? "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      event.is_published
                        ? "bg-sage/15 text-sage-dark"
                        : "bg-clay-900/8 text-clay-500"
                    }`}
                  >
                    {event.is_published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/website/events/${event.id}`}
                    className="mr-3 text-sm font-medium text-terracotta-dark hover:underline"
                  >
                    Edit
                  </Link>
                  <form action={deleteEvent.bind(null, event.id)} className="inline">
                    <button
                      type="submit"
                      className="text-sm font-medium text-clay-500 hover:text-terracotta-dark"
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {events.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-clay-500">
                  No events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
