"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function parsePrice(raw: string): number {
  const price = Number(raw.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Enter a price of $0 or more.");
  }
  return Math.round(price * 100) / 100;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

async function readOrderFields(formData: FormData) {
  const buyer_name = String(formData.get("buyer_name") ?? "").trim();
  if (!buyer_name) throw new Error("Name is required.");

  const item_id = String(formData.get("item_id") ?? "");
  if (!item_id) throw new Error("Pick an item.");

  const quantity = Number(String(formData.get("quantity") ?? "1"));
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be a whole number, 1 or more.");
  }

  // Blank price = use the item's current price, frozen onto this order so a
  // later price change doesn't rewrite what this person owes.
  const rawPrice = String(formData.get("unit_price") ?? "").trim();
  let unit_price: number;
  if (rawPrice === "") {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("merch_items")
      .select("price")
      .eq("id", item_id)
      .single();
    if (error) throw new Error(error.message);
    unit_price = Number(data.price);
  } else {
    unit_price = parsePrice(rawPrice);
  }

  const paid = formData.get("paid") === "on";

  return {
    buyer_name,
    item_id,
    size: String(formData.get("size") ?? "").trim() || null,
    quantity,
    unit_price,
    paid,
    // A payment method only means something once they've paid.
    payment_method: paid ? String(formData.get("payment_method") ?? "").trim() || null : null,
    picked_up: formData.get("picked_up") === "on",
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function createOrder(formData: FormData) {
  const fields = await readOrderFields(formData);
  const supabase = await createClient();
  const { error } = await supabase.from("merch_orders").insert(fields);
  if (error) throw new Error(error.message);

  revalidatePath("/merch");
  redirect("/merch");
}

export async function updateOrder(id: string, formData: FormData) {
  const fields = await readOrderFields(formData);
  const supabase = await createClient();
  const { error } = await supabase.from("merch_orders").update(fields).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/merch");
  redirect("/merch");
}

export async function deleteOrder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("merch_orders").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/merch");
}

// Quick toggles straight from the list, so marking someone paid or picked up
// is one tap instead of opening the edit form.
export async function setPaid(id: string, paid: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("merch_orders")
    .update(paid ? { paid } : { paid, payment_method: null })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/merch");
}

export async function setPickedUp(id: string, picked_up: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("merch_orders").update({ picked_up }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/merch");
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export async function createItem(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");
  const price = parsePrice(String(formData.get("price") ?? "0") || "0");

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("merch_items")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("merch_items")
    .insert({ name, price, sort_order: (last?.sort_order ?? -1) + 1 });
  if (error) throw new Error(error.message);

  revalidatePath("/merch/items");
  revalidatePath("/merch");
}

// Changing an item's price only affects orders added from now on -- existing
// orders keep the price they were placed at.
export async function updateItem(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");
  const price = parsePrice(String(formData.get("price") ?? "0") || "0");

  const supabase = await createClient();
  const { error } = await supabase.from("merch_items").update({ name, price }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/merch/items");
  revalidatePath("/merch");
}

export async function deleteItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("merch_items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/merch/items");
  revalidatePath("/merch");
}
