import { EventForm } from "../EventForm";
import { createEvent } from "../actions";
import { BackLink } from "@/components/BackLink";

export default function NewEventPage() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <BackLink href="/website/events" label="Back to Events" />
        <h1 className="font-display text-2xl text-clay-900">New Event</h1>
      </div>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <EventForm action={createEvent} />
      </div>
    </div>
  );
}
