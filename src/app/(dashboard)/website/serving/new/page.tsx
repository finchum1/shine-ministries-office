import { ServingForm } from "../ServingForm";
import { createServingOpportunity } from "../actions";
import { BackLink } from "@/components/BackLink";

export default function NewServingOpportunityPage() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <BackLink href="/website/serving" label="Back to Serving Opportunities" />
        <h1 className="font-display text-2xl text-clay-900">New Serving Opportunity</h1>
      </div>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <ServingForm action={createServingOpportunity} />
      </div>
    </div>
  );
}
