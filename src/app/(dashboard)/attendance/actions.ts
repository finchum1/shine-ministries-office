"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setAttendance(eventId: string, personId: string, present: boolean) {
  const supabase = await createClient();

  if (present) {
    // upsert + ignoreDuplicates makes a double-tap a no-op instead of a
    // primary-key violation.
    const { error } = await supabase
      .from("event_attendance")
      .upsert(
        { event_id: eventId, person_id: personId },
        { onConflict: "event_id,person_id", ignoreDuplicates: true }
      );
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("event_attendance")
      .delete()
      .eq("event_id", eventId)
      .eq("person_id", personId);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/attendance");
  revalidatePath(`/attendance/${eventId}`);
}

// A walk-in who isn't in the People Directory yet: add them there (so they're
// tracked going forward and can be put in a small group later) and mark them
// present in one step.
export async function addGuest(eventId: string, formData: FormData) {
  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) throw new Error("Name is required.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .insert({
      full_name,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { error: attendanceError } = await supabase
    .from("event_attendance")
    .insert({ event_id: eventId, person_id: data.id });
  if (attendanceError) throw new Error(attendanceError.message);

  revalidatePath("/attendance");
  revalidatePath(`/attendance/${eventId}`);
  revalidatePath("/people");
  revalidatePath("/small-groups");
}
