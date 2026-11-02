import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { MerchItemRow, MerchOrderRow } from "@/lib/supabase-types";
import { BackLink } from "@/components/BackLink";
import { PickupList } from "@/components/PickupList";
import { PrintButton } from "@/components/PrintButton";
import { buildPickupEntries, buildPickupSummary, type PickupShow } from "@/lib/pickup-list";

const pill = (active: boolean) =>
  `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
    active
      ? "bg-clay-900 text-cream"
      : "border border-clay-900/15 text-clay-700 hover:border-terracotta hover:text-clay-900"
  }`;

export default async function PickupListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const showParam = Array.isArray(params.show) ? params.show[0] : params.show;
  const show: PickupShow = showParam === "all" ? "all" : "pending";

  const supabase = await createClient();
  const [{ data: itemsData, error: itemsError }, { data: ordersData, error: ordersError }] =
    await Promise.all([
      supabase.from("merch_items").select("*").order("sort_order", { ascending: true }),
      supabase.from("merch_orders").select("*"),
    ]);

  const items = (itemsData as MerchItemRow[] | null) ?? [];
  const orders = (ordersData as MerchOrderRow[] | null) ?? [];
  const error = itemsError ?? ordersError;

  const entries = buildPickupEntries(orders, items, show);
  const summary = buildPickupSummary(entries, items, show);
  const printedOn = new Date().toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      {/* Screen-only controls; none of this prints. */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <BackLink href="/merch" label="Back to Merch" />
          <h1 className="font-display text-2xl text-clay-900">Pickup List</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/merch/print" className={pill(show === "pending")}>
            Still to pick up
          </Link>
          <Link href="/merch/print?show=all" className={pill(show === "all")}>
            Everyone
          </Link>
          <PrintButton />
        </div>
      </div>
      <p className="mt-2 text-sm text-clay-700 print:hidden">
        A sheet to print and check people off as they pick up. Each box is one person&rsquo;s whole
        order; &ldquo;OWES&rdquo; means they haven&rsquo;t been marked paid yet.
      </p>

      {error && (
        <p className="mt-6 rounded-xl bg-terracotta-light/30 p-4 text-sm text-clay-900 print:hidden">
          Couldn&rsquo;t load orders: {error.message}
        </p>
      )}

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 print:mt-0 print:rounded-none print:p-0 print:shadow-none print:ring-0">
        <PickupList entries={entries} summary={summary} printedOn={printedOn} show={show} />
      </div>
    </div>
  );
}
