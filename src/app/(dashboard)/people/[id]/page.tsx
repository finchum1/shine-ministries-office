import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PersonRow } from "@/lib/supabase-types";
import { PersonForm } from "../PersonForm";
import { updatePerson } from "../actions";

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("people").select("*").eq("id", id).maybeSingle();

  if (!data) notFound();

  const person = data as PersonRow;

  return (
    <div>
      <h1 className="font-display text-2xl text-clay-900">Edit Person</h1>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <PersonForm person={person} action={updatePerson.bind(null, id)} />
      </div>
    </div>
  );
}
