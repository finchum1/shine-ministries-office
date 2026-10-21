import Link from "next/link";
import type { MerchItemRow, MerchOrderRow } from "@/lib/supabase-types";
import { MERCH_SIZES, PAYMENT_METHODS, formatMoney } from "@/lib/merch";

const inputClass =
  "w-full rounded-xl border border-clay-900/12 bg-cream px-4 py-3 text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30";

export function OrderForm({
  order,
  items,
  peopleNames,
  action,
}: {
  order?: MerchOrderRow;
  items: MerchItemRow[];
  /** Directory names, offered as suggestions while typing -- buyers who
   *  aren't in the directory can still be typed in freely. */
  peopleNames: string[];
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Name</span>
        <input
          name="buyer_name"
          required
          list="merch-buyer-names"
          autoComplete="off"
          defaultValue={order?.buyer_name}
          className={inputClass}
        />
        <datalist id="merch-buyer-names">
          {peopleNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Item</span>
        <select
          name="item_id"
          required
          defaultValue={order?.item_id ?? items[0]?.id}
          className={inputClass}
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({formatMoney(Number(item.price))})
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Size</span>
        <select name="size" defaultValue={order?.size ?? ""} className={inputClass}>
          <option value="">No size</option>
          {MERCH_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Quantity</span>
        <input
          name="quantity"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          required
          defaultValue={order?.quantity ?? 1}
          className={inputClass}
        />
      </label>

      <label>
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Price each</span>
        <input
          name="unit_price"
          inputMode="decimal"
          defaultValue={order ? Number(order.unit_price).toFixed(2) : ""}
          placeholder="Leave blank to use the item's price"
          className={inputClass}
        />
      </label>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:col-span-2">
        <label className="flex items-center gap-2.5 text-sm font-medium text-clay-700">
          <input
            type="checkbox"
            name="paid"
            defaultChecked={order?.paid}
            className="h-5 w-5 rounded border-clay-900/30 text-sage focus:ring-sage"
          />
          Paid
        </label>
        <label className="flex items-center gap-2.5 text-sm font-medium text-clay-700">
          <span>Paid with</span>
          <select
            name="payment_method"
            defaultValue={order?.payment_method ?? ""}
            className={`${inputClass} w-auto py-2`}
          >
            <option value="">—</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2.5 text-sm font-medium text-clay-700">
          <input
            type="checkbox"
            name="picked_up"
            defaultChecked={order?.picked_up}
            className="h-5 w-5 rounded border-clay-900/30 text-sage focus:ring-sage"
          />
          Picked up
        </label>
      </div>

      <label className="sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-clay-700">Notes</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={order?.notes ?? ""}
          className={`${inputClass} resize-none`}
        />
      </label>

      <div className="flex items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-sage px-6 py-3 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:brightness-95"
        >
          {order ? "Save changes" : "Add order"}
        </button>
        <Link href="/merch" className="text-sm font-medium text-clay-500 hover:text-clay-900">
          Cancel
        </Link>
      </div>
    </form>
  );
}
