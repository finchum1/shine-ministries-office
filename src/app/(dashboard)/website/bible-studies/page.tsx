import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { BibleStudyRow } from "@/lib/supabase-types";
import { deleteBibleStudy } from "./actions";

export default async function BibleStudiesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bible_studies")
    .select("*")
    .order("sort_order", { ascending: true });

  const studies = (data as BibleStudyRow[] | null) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-clay-900">Bible Studies</h1>
          <p className="mt-1 text-sm text-clay-700">The groups listed on /bible-studies.</p>
        </div>
        <Link
          href="/website/bible-studies/new"
          className="inline-flex items-center justify-center rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark"
        >
          New Bible Study
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-terracotta-light/30 p-4 text-sm text-terracotta-dark">
          Couldn&rsquo;t load Bible studies: {error.message}
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-clay-900/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-soft text-xs font-semibold uppercase tracking-wide text-clay-500">
            <tr>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Day / Time</th>
              <th className="px-5 py-3">Leader</th>
              <th className="px-5 py-3">Active</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-clay-900/8">
            {studies.map((study) => (
              <tr key={study.id}>
                <td className="px-5 py-3 font-medium text-clay-900">{study.title}</td>
                <td className="px-5 py-3 text-clay-700">
                  {[study.day_of_week, study.meeting_time].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-5 py-3 text-clay-700">{study.leader_name ?? "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      study.is_active
                        ? "bg-sage/15 text-sage-dark"
                        : "bg-clay-900/8 text-clay-500"
                    }`}
                  >
                    {study.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/website/bible-studies/${study.id}`}
                    className="mr-3 text-sm font-medium text-terracotta-dark hover:underline"
                  >
                    Edit
                  </Link>
                  <form action={deleteBibleStudy.bind(null, study.id)} className="inline">
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
            {studies.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-clay-500">
                  No Bible studies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
