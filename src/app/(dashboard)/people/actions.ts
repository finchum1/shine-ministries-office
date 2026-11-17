"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MONTHS, isValidMonthDay } from "@/lib/birthday";

type BirthdayCols = { birth_month: number | null; birth_day: number | null; birth_year: number | null };

function readBirthday(formData: FormData): BirthdayCols {
  const month = String(formData.get("birth_month") ?? "").trim();
  const day = String(formData.get("birth_day") ?? "").trim();
  const year = String(formData.get("birth_year") ?? "").trim();

  if (!month && !day) {
    if (year) throw new Error("Pick a month and day for the birthday, or clear the year.");
    return { birth_month: null, birth_day: null, birth_year: null };
  }
  if (!month || !day) throw new Error("A birthday needs both a month and a day.");

  const m = Number(month);
  const d = Number(day);
  if (!isValidMonthDay(m, d)) {
    throw new Error(`${MONTHS[m - 1] ?? "That month"} doesn't have a day ${day}.`);
  }
  let y: number | null = null;
  if (year) {
    y = Number(year);
    if (!Number.isInteger(y) || y < 1900 || y > 2100) {
      throw new Error("Birth year should be between 1900 and 2100.");
    }
    if (m === 2 && d === 29 && !((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) {
      throw new Error(`${y} wasn't a leap year, so there was no February 29.`);
    }
  }
  return { birth_month: m, birth_day: d, birth_year: y };
}

function readFields(formData: FormData) {
  return {
    full_name: String(formData.get("full_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    ...readBirthday(formData),
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

// Accepts "3/14", "3/14/1980", "March 14" or "Mar 14 1980" (no commas -- those
// separate the columns on an import line).
function parseBirthdayText(text: string, who: string): BirthdayCols {
  const t = text.trim();
  if (!t) return { birth_month: null, birth_day: null, birth_year: null };

  let m: number | null = null;
  let d: number | null = null;
  let y: number | null = null;

  const numeric = t.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?$/);
  const named = t.match(/^([A-Za-z]+)\.?\s+(\d{1,2})(?:\s+(\d{4}))?$/);
  if (numeric) {
    m = Number(numeric[1]);
    d = Number(numeric[2]);
    y = numeric[3] ? Number(numeric[3]) : null;
  } else if (named) {
    const idx = MONTHS.findIndex((n) => n.toLowerCase().startsWith(named[1].toLowerCase().slice(0, 3)));
    m = idx >= 0 && named[1].length >= 3 ? idx + 1 : null;
    d = Number(named[2]);
    y = named[3] ? Number(named[3]) : null;
  }

  if (m === null || d === null || !isValidMonthDay(m, d) || (y !== null && (y < 1900 || y > 2100))) {
    throw new Error(`Couldn't read the birthday "${t}" for ${who}. Use 3/14, 3/14/1980 or March 14.`);
  }
  return { birth_month: m, birth_day: d, birth_year: y };
}

// Each line is "Full Name" or "Full Name, email, phone, birthday" -- everything
// after the name is optional per line, so a plain list of names (e.g.
// transcribed from a screenshot) works just as well as a fuller list.
function parseBulkPeople(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [full_name, email, phone, birthday] = line.split(",").map((part) => part.trim());
      return {
        full_name,
        email: email || null,
        phone: phone || null,
        ...parseBirthdayText(birthday ?? "", full_name || "this line"),
      };
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
