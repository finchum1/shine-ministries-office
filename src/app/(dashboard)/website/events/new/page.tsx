import { EventForm } from "../EventForm";
import { createEvent } from "../actions";

export default function NewEventPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-clay-900">New Event</h1>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <EventForm action={createEvent} />
      </div>
    </div>
  );
}
