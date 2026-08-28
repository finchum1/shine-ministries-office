"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function readFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
  };
}

export async function createServingOpportunity(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("serving_opportunities").insert(readFields(formData));
  if (error) throw new Error(error.message);

  revalidatePath("/website/serving");
  redirect("/website/serving");
}

export async function updateServingOpportunity(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("serving_opportunities")
    .update(readFields(formData))
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/website/serving");
  redirect("/website/serving");
}

export async function deleteServingOpportunity(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("serving_opportunities").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/website/serving");
}
