"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function readFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    day_of_week: String(formData.get("day_of_week") ?? "").trim() || null,
    meeting_time: String(formData.get("meeting_time") ?? "").trim() || null,
    location: String(formData.get("location") ?? "").trim() || null,
    leader_name: String(formData.get("leader_name") ?? "").trim() || null,
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    is_active: formData.get("is_active") === "on",
  };
}

export async function createBibleStudy(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("bible_studies").insert(readFields(formData));
  if (error) throw new Error(error.message);

  revalidatePath("/website/bible-studies");
  redirect("/website/bible-studies");
}

export async function updateBibleStudy(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("bible_studies").update(readFields(formData)).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/website/bible-studies");
  redirect("/website/bible-studies");
}

export async function deleteBibleStudy(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("bible_studies").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/website/bible-studies");
}
