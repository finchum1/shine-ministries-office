import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { MerchItemRow } from "@/lib/supabase-types";
import { OrderForm } from "../OrderForm";
import { createOrder } from "../actions";

export default async function NewOrderPage() {
  const supabase = await createClient();
  const [{ data: itemsData }, { data: peopleData }] = await Promise.all([
    supabase.from("merch_items").select("*").order("sort_order", { ascending: true }),
    supabase.from("people").select("full_name").order("full_name", { ascending: true }),
  ]);

  const items = (itemsData as MerchItemRow[] | null) ?? [];
  const peopleNames = ((peopleData as { full_name: string }[] | null) ?? []).map(
    (p) => p.full_name
  );

  return (
    <div>
      <h1 className="font-display text-2xl text-clay-900">New Order</h1>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        {items.length === 0 ? (
          <p className="text-sm text-clay-700">
            Add an item first (like &ldquo;Shine T-shirt&rdquo;) so there&rsquo;s something to
            order.{" "}
            <Link href="/merch/items" className="font-medium text-clay-900 underline">
              Add an item
            </Link>
          </p>
        ) : (
          <OrderForm items={items} peopleNames={peopleNames} action={createOrder} />
        )}
      </div>
    </div>
  );
}
