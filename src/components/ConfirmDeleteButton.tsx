"use client";

import { useState, useTransition } from "react";

// Delete with a two-step confirm, for rows that already have their own Save
// form (so there's no Edit link to pair it with, unlike EditDeleteActions).
export function ConfirmDeleteButton({
  deleteAction,
  itemLabel,
}: {
  deleteAction: () => Promise<void>;
  itemLabel: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm font-medium text-clay-500 hover:text-clay-900"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-3">
      <span className="text-sm text-clay-500">Delete this {itemLabel}?</span>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await deleteAction();
            setConfirming(false);
          })
        }
        className="text-sm font-semibold text-clay-900 hover:underline"
      >
        {isPending ? "Deleting…" : "Confirm"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirming(false)}
        className="text-sm font-medium text-clay-500 hover:text-clay-900"
      >
        Cancel
      </button>
    </span>
  );
}
