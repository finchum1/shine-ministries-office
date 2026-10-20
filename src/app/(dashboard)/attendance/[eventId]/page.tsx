import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { EventRow, PersonRow } from "@/lib/supabase-types";
import { AttendanceChecklist } from "@/components/AttendanceChecklist";
import { addGuest, setAttendance } from "../actions";

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${month}-${day}-${year}`;
}

export default async function EventAttendancePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const [{ data: eventData }, { data: peopleData }, { data: attendanceData }] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).maybeSingle(),
    supabase.from("people").select("id, full_name").order("full_name", { ascending: true }),
    supabase.from("event_attendance").select("person_id").eq("event_id", eventId),
  ]);

  if (!eventData) notFound();

  const event = eventData as EventRow;
  const people = (peopleData as Pick<PersonRow, "id" | "full_name">[] | null) ?? [];
  const presentIds = ((attendanceData as { person_id: string }[] | null) ?? []).map(
    (row) => row.person_id
  );

  return (
    <div>
      <div className="flex items-center gap-2">
        <Link
          href="/attendance"
          aria-label="Back to Attendance"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-clay-500 transition-colors hover:bg-clay-900/5 hover:text-clay-900"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path
              fillRule="evenodd"
              d="M12.53 4.22a.75.75 0 0 1 0 1.06L7.81 10l4.72 4.72a.75.75 0 1 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
        <h1 className="font-display text-2xl text-clay-900">{event.title}</h1>
      </div>
      <p className="mt-1 text-sm text-clay-700">
        {event.date_tbd ? "Date TBD" : formatDate(event.event_date)}
        {event.location ? ` · ${event.location}` : ""}
      </p>

      <AttendanceChecklist
        eventId={event.id}
        people={people}
        presentIds={presentIds}
        setAttendance={setAttendance}
        addGuest={addGuest.bind(null, event.id)}
      />
    </div>
  );
}
