import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { MerchItemRow } from "@/lib/supabase-types";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { createItem, updateItem, deleteItem } from "../actions";

const inputClass =
  "w-full rounded-xl border border-clay-900/12 bg-cream px-4 py-3 text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30";

// Public page where people place an order and are sent on to pay.
const ORDER_PAGE_URL = "https://merch.shineministriesok.com";

const saveButtonClass =
  "shrink-0 rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:brightness-95";

export default async function MerchItemsPage() {
  const supabase = await createClient();
  const [{ data: itemsData, error }, { data: ordersData }] = await Promise.all([
    supabase.from("merch_items").select("*").order("sort_order", { ascending: true }),
    supabase.from("merch_orders").select("item_id"),
  ]);

  const items = (itemsData as MerchItemRow[] | null) ?? [];
  const orderCounts = new Map<string, number>();
  for (const order of (ordersData as { item_id: string }[] | null) ?? []) {
    orderCounts.set(order.item_id, (orderCounts.get(order.item_id) ?? 0) + 1);
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Link
          href="/merch"
          aria-label="Back to Merch"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-clay-500 transition-colors hover:bg-clay-900/5 hover:text-clay-900"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path
              fillRule="evenodd"
              d="M12.53 4.22a.75.75 0 0 1 0 1.06L7.81 10l4.72 4.72a.75.75 0 1 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
        <h1 className="font-display text-2xl text-clay-900">Merch Items</h1>
      </div>
      <p className="mt-1 text-sm text-clay-700">
        What&rsquo;s for sale and what it costs. Changing a price only affects orders added after
        that &mdash; existing orders keep the price they were placed at.
      </p>

      {error && (
        <p className="mt-6 rounded-xl bg-terracotta-light/30 p-4 text-sm text-clay-900">
          Couldn&rsquo;t load items: {error.message}
        </p>
      )}

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5">
        <h2 className="font-display text-lg text-clay-900">Add an item</h2>
        <form action={createItem} className="mt-4 flex flex-wrap gap-3">
          <input
            name="name"
            required
            placeholder="e.g. Shine T-shirt"
            aria-label="Item name"
            className={`${inputClass} min-w-48 flex-1`}
          />
          <input
            name="price"
            inputMode="decimal"
            placeholder="Price"
            aria-label="Price"
            className={`${inputClass} w-28`}
          />
          <input
            name="payment_url"
            type="url"
            placeholder="Payment link (optional) — where buyers pay"
            aria-label="Payment link"
            className={`${inputClass} basis-full`}
          />
          <label className="flex basis-full items-center gap-2.5 text-sm font-medium text-clay-700">
            <input
              type="checkbox"
              name="orders_open"
              className="h-5 w-5 rounded border-clay-900/30 text-sage focus:ring-sage"
            />
            Open for online orders
          </label>
          <button type="submit" className={saveButtonClass}>
            Add item
          </button>
        </form>
      </div>

      <ul className="mt-6 divide-y divide-clay-900/8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-clay-900/5">
        {items.map((item) => {
          const orderCount = orderCounts.get(item.id) ?? 0;
          return (
            <li key={item.id} className="p-5">
              <form action={updateItem.bind(null, item.id)} className="flex flex-wrap gap-3">
                <input
                  name="name"
                  required
                  defaultValue={item.name}
                  aria-label="Item name"
                  className={`${inputClass} min-w-48 flex-1`}
                />
                <input
                  name="price"
                  inputMode="decimal"
                  defaultValue={Number(item.price).toFixed(2)}
                  aria-label="Price"
                  className={`${inputClass} w-28`}
                />
                <input
                  name="payment_url"
                  type="url"
                  defaultValue={item.payment_url ?? ""}
                  placeholder="Payment link (optional) — where buyers pay"
                  aria-label="Payment link"
                  className={`${inputClass} basis-full`}
                />
                <label className="flex basis-full items-center gap-2.5 text-sm font-medium text-clay-700">
                  <input
                    type="checkbox"
                    name="orders_open"
                    defaultChecked={item.orders_open}
                    className="h-5 w-5 rounded border-clay-900/30 text-sage focus:ring-sage"
                  />
                  Open for online orders
                </label>
                <button type="submit" className={saveButtonClass}>
                  Save
                </button>
              </form>
              {(item.orders_open || item.payment_url) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {item.orders_open && (
                    <CopyLinkButton url={ORDER_PAGE_URL} label="Copy order page link" />
                  )}
                  {item.payment_url && (
                    <CopyLinkButton url={item.payment_url} label="Copy payment link" />
                  )}
                </div>
              )}
              <div className="mt-3 text-sm text-clay-500">
                {orderCount > 0 ? (
                  <span>
                    {orderCount} order{orderCount === 1 ? "" : "s"} &mdash; can&rsquo;t be deleted
                    while it has orders.
                  </span>
                ) : (
                  <ConfirmDeleteButton
                    deleteAction={deleteItem.bind(null, item.id)}
                    itemLabel="item"
                  />
                )}
              </div>
            </li>
          );
        })}
        {items.length === 0 && !error && (
          <li className="px-5 py-8 text-center text-clay-500">No items yet.</li>
        )}
      </ul>
    </div>
  );
}
