import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MerchItemRow, MerchOrderRow } from "@/lib/supabase-types";
import { BackLink } from "@/components/BackLink";
import { OrderForm } from "../OrderForm";
import { updateOrder } from "../actions";

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: orderData }, { data: itemsData }, { data: peopleData }] = await Promise.all([
    supabase.from("merch_orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("merch_items").select("*").order("sort_order", { ascending: true }),
    supabase.from("people").select("full_name").order("full_name", { ascending: true }),
  ]);

  if (!orderData) notFound();

  const order = orderData as MerchOrderRow;
  const items = (itemsData as MerchItemRow[] | null) ?? [];
  const peopleNames = ((peopleData as { full_name: string }[] | null) ?? []).map(
    (p) => p.full_name
  );

  return (
    <div>
      <div className="flex items-center gap-2">
        <BackLink href="/merch" label="Back to Merch" />
        <h1 className="font-display text-2xl text-clay-900">Edit Order</h1>
      </div>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <OrderForm
          order={order}
          items={items}
          peopleNames={peopleNames}
          action={updateOrder.bind(null, id)}
        />
      </div>
    </div>
  );
}
