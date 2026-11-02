import { formatMoney } from "@/lib/merch";
import type { PickupEntry, PickupShow, PickupSummaryRow } from "@/lib/pickup-list";

// The printable sheet: a checkbox per person, what they ordered, and whether
// they still owe anything -- plus how many of each item to have on hand.
// Presentational only (no data fetching), so the page and any preview can
// share it.
export function PickupList({
  entries,
  summary,
  printedOn,
  show,
}: {
  entries: PickupEntry[];
  summary: PickupSummaryRow[];
  printedOn: string;
  show: PickupShow;
}) {
  const stillOwed = entries.reduce((sum, e) => sum + e.owed, 0);

  return (
    <div className="text-clay-900 print:text-black">
      <header className="border-b-2 border-clay-900 pb-3 print:border-black">
        <h2 className="font-display text-2xl print:text-3xl">Shine Merch — Pickup List</h2>
        <p className="mt-1 text-sm text-clay-700 print:text-black">
          {printedOn} · {entries.length} {entries.length === 1 ? "order" : "orders"}
          {show === "pending" ? " still to pick up" : ""}
          {stillOwed > 0 ? ` · ${formatMoney(stillOwed)} still to collect` : ""}
        </p>
      </header>

      {summary.length > 0 && (
        <section className="mt-4 rounded-lg border border-clay-900/20 p-3 print:break-inside-avoid print:border-black">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-clay-700 print:text-black">
            To have on hand
          </h3>
          <ul className="mt-1.5 space-y-0.5 text-sm">
            {summary.map((row) => (
              <li key={row.itemId}>
                <span className="font-semibold">{row.itemName}</span> — {row.total}
                {row.sizes.length > 0 && (
                  <span className="text-clay-700 print:text-black">
                    {" "}
                    ({row.sizes.map(([size, n]) => `${size} × ${n}`).join(", ")})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <table className="mt-5 w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b-2 border-clay-900 text-xs font-semibold uppercase tracking-wide print:border-black">
            <th className="w-14 whitespace-nowrap pb-2 pr-3">Got it</th>
            <th className="pb-2 pr-4">Name</th>
            <th className="pb-2 pr-4">Order</th>
            <th className="pb-2 text-right">Payment</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.key}
              className="border-b border-clay-900/25 align-top print:break-inside-avoid print:border-black/40"
            >
              <td className="py-3 pr-3 print:py-2">
                <span className="block h-6 w-6 rounded border-2 border-clay-900 print:border-black" />
              </td>
              <td className="py-3 pr-4 print:py-2">
                <p className="font-semibold">{entry.name}</p>
                {(entry.phone || entry.email) && (
                  <p className="mt-0.5 text-xs text-clay-700 print:text-black">
                    {[entry.phone, entry.email].filter(Boolean).join(" · ")}
                  </p>
                )}
              </td>
              <td className="py-3 pr-4 print:py-2">
                <ul className="space-y-0.5">
                  {entry.lines.map((line, i) => (
                    <li key={i} className={line.pickedUp ? "text-clay-500 line-through print:text-black/60" : undefined}>
                      {line.quantity} × {line.itemName}
                      {line.size ? ` — ${line.size}` : ""}
                      {line.pickedUp ? " (picked up)" : ""}
                    </li>
                  ))}
                </ul>
                {entry.notes.map((note, i) => (
                  <p key={i} className="mt-1 text-xs italic text-clay-700 print:text-black">
                    {note}
                  </p>
                ))}
              </td>
              <td className="whitespace-nowrap py-3 text-right print:py-2">
                <p>{formatMoney(entry.total)}</p>
                {entry.owed > 0 ? (
                  <p className="font-bold">OWES {formatMoney(entry.owed)}</p>
                ) : (
                  <p className="text-clay-700 print:text-black">Paid</p>
                )}
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-clay-500 print:text-black">
                {show === "pending" ? "Everything has been picked up." : "No orders yet."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
