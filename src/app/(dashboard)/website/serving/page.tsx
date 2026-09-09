import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ServingOpportunityRow } from "@/lib/supabase-types";
import { deleteServingOpportunity } from "./actions";

export default async function ServingPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("serving_opportunities")
    .select("*")
    .order("sort_order", { ascending: true });

  const opportunities = (data as ServingOpportunityRow[] | null) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-clay-900">Serving Opportunities</h1>
          <p className="mt-1 text-sm text-clay-700">The cards on the Get Involved page.</p>
        </div>
        <Link
          href="/website/serving/new"
          className="inline-flex items-center justify-center rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark"
        >
          New Opportunity
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-terracotta-light/30 p-4 text-sm text-terracotta-dark">
          Couldn&rsquo;t load serving opportunities: {error.message}
        </p>
      )}

      {/* Desktop / wide screens: table. */}
      <div className="mt-8 hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-clay-900/5 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-soft text-xs font-semibold uppercase tracking-wide text-clay-500">
            <tr>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-clay-900/8">
            {opportunities.map((opportunity) => (
              <tr key={opportunity.id}>
                <td className="px-5 py-3 font-medium text-clay-900">{opportunity.title}</td>
                <td className="max-w-md truncate px-5 py-3 text-clay-700">
                  {opportunity.description ?? "—"}
                </td>
                <td className="px-5 py-3 text-clay-700">{opportunity.sort_order}</td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/website/serving/${opportunity.id}`}
                    className="mr-3 text-sm font-medium text-terracotta-dark hover:underline"
                  >
                    Edit
                  </Link>
                  <form action={deleteServingOpportunity.bind(null, opportunity.id)} className="inline">
                    <button
                      type="submit"
                      className="text-sm font-medium text-clay-500 hover:text-terracotta-dark"
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {opportunities.length === 0 && !error && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-clay-500">
                  No serving opportunities yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Small screens: cards -- a four-column table doesn't fit a phone. */}
      <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-clay-900/5 md:hidden">
        <ul className="divide-y divide-clay-900/8">
          {opportunities.map((opportunity) => (
            <li key={opportunity.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-clay-900">{opportunity.title}</p>
                <span className="shrink-0 rounded-full bg-clay-900/8 px-2.5 py-1 text-xs font-medium text-clay-500">
                  #{opportunity.sort_order}
                </span>
              </div>
              {opportunity.description && (
                <p className="mt-2 text-sm text-clay-700">{opportunity.description}</p>
              )}
              <div className="mt-3 flex items-center gap-4 border-t border-clay-900/8 pt-3">
                <Link
                  href={`/website/serving/${opportunity.id}`}
                  className="text-sm font-medium text-terracotta-dark hover:underline"
                >
                  Edit
                </Link>
                <form action={deleteServingOpportunity.bind(null, opportunity.id)}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-clay-500 hover:text-terracotta-dark"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
          {opportunities.length === 0 && !error && (
            <li className="px-5 py-8 text-center text-clay-500">No serving opportunities yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
