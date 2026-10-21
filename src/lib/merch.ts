// Shirt sizes in the order they should read (and sort) everywhere in Merch.
export const MERCH_SIZES = [
  "Youth S",
  "Youth M",
  "Youth L",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
] as const;

export const PAYMENT_METHODS = ["Cash", "Check", "Venmo", "Zelle", "Other"] as const;

export function sizeRank(size: string): number {
  const i = (MERCH_SIZES as readonly string[]).indexOf(size);
  return i === -1 ? MERCH_SIZES.length : i;
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
