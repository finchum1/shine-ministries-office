import type { MerchItemRow, MerchOrderRow } from "@/lib/supabase-types";
import { sizeRank } from "@/lib/merch";

export type PickupShow = "pending" | "all";

export type PickupLine = {
  itemId: string;
  itemName: string;
  size: string | null;
  quantity: number;
  pickedUp: boolean;
};

// One person's pickup: everything they ordered together (a combined website
// order is one entry; so is any single order) with what they still owe.
export type PickupEntry = {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  lines: PickupLine[];
  total: number;
  owed: number;
  notes: string[];
};

export type PickupSummaryRow = {
  itemId: string;
  itemName: string;
  total: number;
  // Per size, in size order. Empty for items without sizes.
  sizes: [string, number][];
};

const money = (order: MerchOrderRow) => order.quantity * Number(order.unit_price);

// Groups the order rows into pickup entries, alphabetical by name. "pending"
// keeps only entries with something still to hand over.
export function buildPickupEntries(
  orders: MerchOrderRow[],
  items: Pick<MerchItemRow, "id" | "name">[],
  show: PickupShow
): PickupEntry[] {
  const itemName = new Map(items.map((i) => [i.id, i.name]));
  const groups = new Map<string, MerchOrderRow[]>();
  for (const o of orders) {
    const key = o.checkout_id ?? o.id;
    const list = groups.get(key) ?? [];
    list.push(o);
    groups.set(key, list);
  }

  const entries: PickupEntry[] = [...groups.entries()].map(([key, rows]) => ({
    key,
    name: rows[0].buyer_name,
    email: rows.find((r) => r.buyer_email)?.buyer_email ?? null,
    phone: rows.find((r) => r.buyer_phone)?.buyer_phone ?? null,
    lines: rows.map((r) => ({
      itemId: r.item_id,
      itemName: itemName.get(r.item_id) ?? "Item",
      size: r.size,
      quantity: r.quantity,
      pickedUp: r.picked_up,
    })),
    total: rows.reduce((sum, r) => sum + money(r), 0),
    owed: rows.filter((r) => !r.paid).reduce((sum, r) => sum + money(r), 0),
    notes: rows.map((r) => r.notes).filter((n): n is string => Boolean(n)),
  }));

  return entries
    .filter((e) => show === "all" || e.lines.some((l) => !l.pickedUp))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// How many of each item (and size) to have on hand for the entries listed.
export function buildPickupSummary(
  entries: PickupEntry[],
  items: Pick<MerchItemRow, "id" | "name" | "sort_order">[],
  show: PickupShow
): PickupSummaryRow[] {
  const byItem = new Map<string, { total: number; sizes: Map<string, number> }>();
  for (const e of entries) {
    for (const l of e.lines) {
      if (show === "pending" && l.pickedUp) continue;
      const row = byItem.get(l.itemId) ?? { total: 0, sizes: new Map<string, number>() };
      row.total += l.quantity;
      if (l.size) row.sizes.set(l.size, (row.sizes.get(l.size) ?? 0) + l.quantity);
      byItem.set(l.itemId, row);
    }
  }

  return items
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((i) => byItem.has(i.id))
    .map((i) => {
      const row = byItem.get(i.id)!;
      return {
        itemId: i.id,
        itemName: i.name,
        total: row.total,
        sizes: [...row.sizes.entries()].sort(
          (a, b) => sizeRank(a[0]) - sizeRank(b[0]) || a[0].localeCompare(b[0])
        ),
      };
    });
}
