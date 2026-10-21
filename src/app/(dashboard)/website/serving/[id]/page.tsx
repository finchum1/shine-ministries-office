import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ServingOpportunityRow } from "@/lib/supabase-types";
import { ServingForm } from "../ServingForm";
import { updateServingOpportunity } from "../actions";
import { BackLink } from "@/components/BackLink";

export default async function EditServingOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("serving_opportunities")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const opportunity = data as ServingOpportunityRow;

  return (
    <div>
      <div className="flex items-center gap-2">
        <BackLink href="/website/serving" label="Back to Serving Opportunities" />
        <h1 className="font-display text-2xl text-clay-900">Edit Serving Opportunity</h1>
      </div>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <ServingForm opportunity={opportunity} action={updateServingOpportunity.bind(null, id)} />
      </div>
    </div>
  );
}
