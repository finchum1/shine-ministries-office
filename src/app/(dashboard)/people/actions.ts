"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function readFields(formData: FormData) {
  return {
    full_name: String(formData.get("full_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
  };
}

export async function createPerson(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("people").insert(readFields(formData));
  if (error) throw new Error(error.message);

  revalidatePath("/people");
  redirect("/people");
}

export async function updatePerson(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("people").update(readFields(formData)).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/people");
  revalidatePath("/small-groups");
  redirect("/people");
}

export async function deletePerson(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("people").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/people");
  revalidatePath("/small-groups");
}

// Each line is "Full Name" or "Full Name, email, phone" -- email/phone are
// optional per line, so a plain list of names (e.g. transcribed from a
// screenshot) works just as well as a fuller comma-separated list.
function parseBulkPeople(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [full_name, email, phone] = line.split(",").map((part) => part.trim());
      return { full_name, email: email || null, phone: phone || null };
    })
    .filter((person) => person.full_name.length > 0);
}

export async function importPeople(formData: FormData) {
  const text = String(formData.get("people_text") ?? "");
  const people = parseBulkPeople(text);

  if (people.length === 0) {
    throw new Error("No names found -- add at least one name, one per line.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("people").insert(people);
  if (error) throw new Error(error.message);

  revalidatePath("/people");
  redirect("/people");
}
