import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EventRow } from "@/lib/supabase-types";
import { EventForm } from "../EventForm";
import { updateEvent } from "../actions";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();

  if (!data) notFound();

  const event = data as EventRow;

  return (
    <div>
      <h1 className="font-display text-2xl text-clay-900">Edit Event</h1>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <EventForm event={event} action={updateEvent.bind(null, id)} />
      </div>
    </div>
  );
}
