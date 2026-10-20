import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type EventWithCount = {
  id: string;
  title: string;
  event_date: string;
  date_tbd: boolean;
  event_attendance: { count: number }[] | null;
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${month}-${day}-${year}`;
}

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export default async function AttendancePage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, event_date, date_tbd, event_attendance(count)")
    .order("event_date", { ascending: false });

  const events = (data as EventWithCount[] | null) ?? [];
  const today = todayString();

  // Gatherings that haven't happened yet can't have attendance, so they sit
  // in their own "Upcoming" list (soonest first) below the ones to record.
  const happened = events.filter((e) => e.date_tbd === false && e.event_date <= today);
  const upcoming = events
    .filter((e) => e.date_tbd || e.event_date > today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  function row(event: EventWithCount, canRecord: boolean) {
    const count = event.event_attendance?.[0]?.count ?? 0;
    return (
      <li key={event.id}>
        <Link
          href={`/attendance/${event.id}`}
          className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-clay-900/3"
        >
          <div className="min-w-0">
            <p className="font-medium text-clay-900">{event.title}</p>
            <p className="mt-0.5 text-sm text-clay-700">
              {event.date_tbd ? "Date TBD" : formatDate(event.event_date)}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
              count > 0
                ? "bg-sage/15 text-clay-900"
                : canRecord
                  ? "bg-terracotta-light/30 text-clay-900"
                  : "bg-clay-900/8 text-clay-500"
            }`}
          >
            {count > 0 ? `${count} attended` : canRecord ? "Not recorded" : "—"}
          </span>
        </Link>
      </li>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-clay-900">Attendance</h1>
      <p className="mt-1 text-sm text-clay-700">
        Pick a gathering to check off who was there. Events come from the Events list on the
        website.
      </p>

      {error && (
        <p className="mt-6 rounded-xl bg-terracotta-light/30 p-4 text-sm text-clay-900">
          Couldn&rsquo;t load events: {error.message}
        </p>
      )}

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-[0.15em] text-clay-500">
        Past &amp; today
      </h2>
      <ul className="mt-3 divide-y divide-clay-900/8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-clay-900/5">
        {happened.map((e) => row(e, true))}
        {happened.length === 0 && !error && (
          <li className="px-5 py-8 text-center text-clay-500">No past events yet.</li>
        )}
      </ul>

      {upcoming.length > 0 && (
        <>
          <h2 className="mt-8 text-xs font-semibold uppercase tracking-[0.15em] text-clay-500">
            Upcoming
          </h2>
          <ul className="mt-3 divide-y divide-clay-900/8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-clay-900/5">
            {upcoming.map((e) => row(e, false))}
          </ul>
        </>
      )}
    </div>
  );
}
