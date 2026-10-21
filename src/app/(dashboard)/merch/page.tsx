import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { MerchItemRow, MerchOrderRow } from "@/lib/supabase-types";
import { EditDeleteActions } from "@/components/EditDeleteActions";
import { formatMoney, sizeRank } from "@/lib/merch";
import { deleteOrder, setPaid, setPickedUp } from "./actions";

const inputClass =
  "rounded-xl border border-clay-900/12 bg-cream px-4 py-2.5 text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30";

type StatusFilter = "all" | "unpaid" | "paid" | "not_picked_up";

function lineTotal(order: MerchOrderRow) {
  return order.quantity * Number(order.unit_price);
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function StatusButtons({ order }: { order: MerchOrderRow }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <form action={setPaid.bind(null, order.id, !order.paid)}>
        <button
          type="submit"
          title={order.paid ? "Mark as unpaid" : "Mark as paid"}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            order.paid
              ? "bg-sage/15 text-clay-900 hover:bg-sage/25"
              : "bg-terracotta-light/40 text-clay-900 hover:bg-terracotta-light/60"
          }`}
        >
          {order.paid ? `Paid${order.payment_method ? ` · ${order.payment_method}` : ""}` : "Unpaid"}
        </button>
      </form>
      <form action={setPickedUp.bind(null, order.id, !order.picked_up)}>
        <button
          type="submit"
          title={order.picked_up ? "Mark as not picked up" : "Mark as picked up"}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            order.picked_up
              ? "bg-sage/15 text-clay-900 hover:bg-sage/25"
              : "bg-clay-900/8 text-clay-500 hover:bg-clay-900/12"
          }`}
        >
          {order.picked_up ? "Picked up" : "Not picked up"}
        </button>
      </form>
    </span>
  );
}

export default async function MerchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = (first(params.q) ?? "").trim();
  const itemFilter = first(params.item) ?? "";
  const status = (first(params.status) ?? "all") as StatusFilter;

  const supabase = await createClient();
  const [{ data: itemsData, error: itemsError }, { data: ordersData, error: ordersError }] =
    await Promise.all([
      supabase.from("merch_items").select("*").order("sort_order", { ascending: true }),
      supabase.from("merch_orders").select("*").order("buyer_name", { ascending: true }),
    ]);

  const items = (itemsData as MerchItemRow[] | null) ?? [];
  const orders = (ordersData as MerchOrderRow[] | null) ?? [];
  const error = itemsError ?? ordersError;
  const itemName = new Map(items.map((i) => [i.id, i.name]));

  // Totals and size counts always cover every order, not just the filtered
  // view -- they're the numbers you'd hand to whoever is printing the shirts.
  const totalDue = orders.reduce((sum, o) => sum + lineTotal(o), 0);
  const collected = orders.filter((o) => o.paid).reduce((sum, o) => sum + lineTotal(o), 0);
  const units = orders.reduce((sum, o) => sum + o.quantity, 0);

  const sizeCounts = items
    .map((item) => {
      const bySize = new Map<string, number>();
      for (const o of orders.filter((o) => o.item_id === item.id)) {
        const key = o.size ?? "No size";
        bySize.set(key, (bySize.get(key) ?? 0) + o.quantity);
      }
      const sizes = [...bySize.entries()].sort(
        (a, b) => sizeRank(a[0]) - sizeRank(b[0]) || a[0].localeCompare(b[0])
      );
      return { item, sizes, total: sizes.reduce((s, [, n]) => s + n, 0) };
    })
    .filter((entry) => entry.total > 0);

  const needle = q.toLowerCase();
  const visible = orders.filter((o) => {
    if (needle && !o.buyer_name.toLowerCase().includes(needle)) return false;
    if (itemFilter && o.item_id !== itemFilter) return false;
    if (status === "unpaid" && o.paid) return false;
    if (status === "paid" && !o.paid) return false;
    if (status === "not_picked_up" && o.picked_up) return false;
    return true;
  });
  const filtering = Boolean(needle || itemFilter || status !== "all");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-clay-900">Merch</h1>
          <p className="mt-1 text-sm text-clay-700">
            Who ordered what, in what size, and who has paid. Tap Paid or Picked up on an order to
            flip it.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/merch/items"
            className="inline-flex items-center justify-center rounded-full border border-clay-900/15 px-5 py-2.5 text-sm font-medium text-clay-700 transition-colors hover:border-terracotta hover:text-clay-900"
          >
            Manage Items
          </Link>
          <Link
            href="/merch/new"
            className="inline-flex items-center justify-center rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:brightness-95"
          >
            New Order
          </Link>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-terracotta-light/30 p-4 text-sm text-clay-900">
          Couldn&rsquo;t load merch: {error.message}
        </p>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Orders", value: String(orders.length) },
          { label: "Items ordered", value: String(units) },
          { label: "Collected", value: formatMoney(collected) },
          { label: "Still owed", value: formatMoney(totalDue - collected) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-clay-900/5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-clay-500">
              {stat.label}
            </dt>
            <dd className="mt-1 font-display text-2xl text-clay-900">{stat.value}</dd>
          </div>
        ))}
      </dl>

      {sizeCounts.length > 0 && (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5">
          <h2 className="font-display text-lg text-clay-900">Sizes to order</h2>
          <ul className="mt-3 space-y-3">
            {sizeCounts.map(({ item, sizes, total }) => (
              <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-sm font-medium text-clay-900">
                  {item.name} <span className="font-normal text-clay-500">({total})</span>
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {sizes.map(([size, count]) => (
                    <span
                      key={size}
                      className="rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-clay-900"
                    >
                      {size} × {count}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form method="get" className="mt-8 flex flex-wrap items-center gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search names"
          aria-label="Search names"
          className={`${inputClass} min-w-48 flex-1`}
        />
        <select name="item" defaultValue={itemFilter} aria-label="Item" className={inputClass}>
          <option value="">All items</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status} aria-label="Status" className={inputClass}>
          <option value="all">Any status</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="not_picked_up">Not picked up</option>
        </select>
        <button
          type="submit"
          className="rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:brightness-95"
        >
          Filter
        </button>
        {filtering && (
          <Link href="/merch" className="text-sm font-medium text-clay-500 hover:text-clay-900">
            Clear
          </Link>
        )}
      </form>
      {filtering && (
        <p className="mt-3 text-sm text-clay-700">
          Showing {visible.length} of {orders.length} orders.
        </p>
      )}

      {/* Desktop / wide screens: table. */}
      <div className="mt-6 hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-clay-900/5 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-soft text-xs font-semibold uppercase tracking-wide text-clay-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Item</th>
              <th className="px-5 py-3">Size</th>
              <th className="px-5 py-3">Qty</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-clay-900/8">
            {visible.map((order) => (
              <tr key={order.id}>
                <td className="px-5 py-3 font-medium text-clay-900">
                  {order.buyer_name}
                  {order.notes && (
                    <span className="mt-0.5 block text-xs font-normal text-clay-500">
                      {order.notes}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-clay-700">{itemName.get(order.item_id) ?? "—"}</td>
                <td className="px-5 py-3 text-clay-700">{order.size ?? "—"}</td>
                <td className="px-5 py-3 text-clay-700">{order.quantity}</td>
                <td className="px-5 py-3 text-clay-700">{formatMoney(lineTotal(order))}</td>
                <td className="px-5 py-3">
                  <StatusButtons order={order} />
                </td>
                <td className="px-5 py-3 text-right">
                  <EditDeleteActions
                    editHref={`/merch/${order.id}`}
                    deleteAction={deleteOrder.bind(null, order.id)}
                    itemLabel="order"
                    variant="table"
                  />
                </td>
              </tr>
            ))}
            {visible.length === 0 && !error && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-clay-500">
                  {orders.length === 0 ? "No orders yet." : "No orders match those filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Small screens: cards -- a seven-column table doesn't fit a phone. */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-clay-900/5 md:hidden">
        <ul className="divide-y divide-clay-900/8">
          {visible.map((order) => (
            <li key={order.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-clay-900">{order.buyer_name}</p>
                <p className="shrink-0 text-sm font-medium text-clay-900">
                  {formatMoney(lineTotal(order))}
                </p>
              </div>
              <p className="mt-1 text-sm text-clay-700">
                {[
                  itemName.get(order.item_id),
                  order.size,
                  order.quantity > 1 ? `× ${order.quantity}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {order.notes && <p className="mt-1 text-xs text-clay-500">{order.notes}</p>}
              <div className="mt-3">
                <StatusButtons order={order} />
              </div>
              <EditDeleteActions
                editHref={`/merch/${order.id}`}
                deleteAction={deleteOrder.bind(null, order.id)}
                itemLabel="order"
                variant="card"
              />
            </li>
          ))}
          {visible.length === 0 && !error && (
            <li className="px-5 py-8 text-center text-clay-500">
              {orders.length === 0 ? "No orders yet." : "No orders match those filters."}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
