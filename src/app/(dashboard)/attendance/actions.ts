"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Saves the headcount for one event. A blank field clears it back to
// "not recorded" rather than saving a 0, since 0 is a real answer.
export async function setHeadcount(eventId: string, formData: FormData) {
  const raw = String(formData.get("headcount") ?? "").trim();
  const supabase = await createClient();

  if (raw === "") {
    const { error } = await supabase.from("event_attendance").delete().eq("event_id", eventId);
    if (error) throw new Error(error.message);
  } else {
    const headcount = Number(raw);
    if (!Number.isInteger(headcount) || headcount < 0) {
      throw new Error("Enter a whole number, 0 or more.");
    }
    const { error } = await supabase
      .from("event_attendance")
      .upsert(
        { event_id: eventId, headcount, updated_at: new Date().toISOString() },
        { onConflict: "event_id" }
      );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/attendance");
}
