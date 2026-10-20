import { createClient } from "@/lib/supabase/server";
import { HeadcountForm } from "@/components/HeadcountForm";
import { setHeadcount } from "./actions";

type EventWithHeadcount = {
  id: string;
  title: string;
  event_date: string;
  date_tbd: boolean;
  // event_id is the primary key of event_attendance, so PostgREST treats this
  // as one-to-one and returns an object; tolerate an array too.
  event_attendance: { headcount: number } | { headcount: number }[] | null;
};

function headcountOf(event: EventWithHeadcount): number | null {
  const rel = event.event_attendance;
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0]?.headcount ?? null) : rel.headcount;
}

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
    .select("id, title, event_date, date_tbd, event_attendance(headcount)")
    .order("event_date", { ascending: false });

  const events = (data as EventWithHeadcount[] | null) ?? [];
  const today = todayString();

  // Events that haven't happened yet can't have a headcount, so they sit in
  // their own "Upcoming" list (soonest first) below the ones to record.
  const happened = events.filter((e) => !e.date_tbd && e.event_date <= today);
  const upcoming = events
    .filter((e) => e.date_tbd || e.event_date > today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  return (
    <div>
      <h1 className="font-display text-2xl text-clay-900">Attendance</h1>
      <p className="mt-1 text-sm text-clay-700">
        Enter how many people came to each gathering. Leave it blank if you haven&rsquo;t counted
        yet. Events come from the Events list on the website.
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
        {happened.map((event) => (
          <li key={event.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <p className="font-medium text-clay-900">{event.title}</p>
              <p className="mt-0.5 text-sm text-clay-700">{formatDate(event.event_date)}</p>
            </div>
            <HeadcountForm
              initialHeadcount={headcountOf(event)}
              saveAction={setHeadcount.bind(null, event.id)}
            />
          </li>
        ))}
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
            {upcoming.map((event) => (
              <li key={event.id} className="px-5 py-4">
                <p className="font-medium text-clay-900">{event.title}</p>
                <p className="mt-0.5 text-sm text-clay-700">
                  {event.date_tbd ? "Date TBD" : formatDate(event.event_date)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
