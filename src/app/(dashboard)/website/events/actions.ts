"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function readEventFields(formData: FormData) {
  const highlight = String(formData.get("highlight") ?? "");
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    event_date: String(formData.get("event_date") ?? ""),
    event_time: String(formData.get("event_time") ?? "").trim() || null,
    location: String(formData.get("location") ?? "").trim() || null,
    rsvp_url: String(formData.get("rsvp_url") ?? "").trim() || null,
    highlight: highlight === "lavender" || highlight === "sage" ? highlight : null,
    date_tbd: formData.get("date_tbd") === "on",
    is_published: formData.get("is_published") === "on",
  };
}

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const fields = readEventFields(formData);

  const { error } = await supabase.from("events").insert(fields);
  if (error) throw new Error(error.message);

  revalidatePath("/website/events");
  redirect("/website/events");
}

export async function updateEvent(id: string, formData: FormData) {
  const supabase = await createClient();
  const fields = readEventFields(formData);

  const { error } = await supabase.from("events").update(fields).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/website/events");
  redirect("/website/events");
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/website/events");
}
