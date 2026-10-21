import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BibleStudyRow } from "@/lib/supabase-types";
import { BibleStudyForm } from "../BibleStudyForm";
import { updateBibleStudy } from "../actions";
import { BackLink } from "@/components/BackLink";

export default async function EditBibleStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("bible_studies").select("*").eq("id", id).maybeSingle();

  if (!data) notFound();

  const study = data as BibleStudyRow;

  return (
    <div>
      <div className="flex items-center gap-2">
        <BackLink href="/website/bible-studies" label="Back to Bible Studies" />
        <h1 className="font-display text-2xl text-clay-900">Edit Bible Study</h1>
      </div>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <BibleStudyForm study={study} action={updateBibleStudy.bind(null, id)} />
      </div>
    </div>
  );
}
