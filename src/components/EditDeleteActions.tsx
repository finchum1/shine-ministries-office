"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

type Props = {
  editHref: string;
  deleteAction: () => Promise<void>;
  itemLabel: string;
  /** "table" keeps Edit + Delete inline in a table row's action cell.
   *  "card" is for the mobile card footer -- confirming replaces the whole
   *  row (Edit disappears too) so the Confirm button never ends up sitting
   *  right where Edit used to be. */
  variant: "table" | "card";
};

export function EditDeleteActions({ editHref, deleteAction, itemLabel, variant }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      await deleteAction();
      setConfirming(false);
    });
  };

  if (confirming && variant === "card") {
    return (
      <div className="mt-3 border-t border-clay-900/8 pt-3">
        <div className="flex items-center justify-between gap-3 rounded-lg bg-terracotta-light/25 px-3 py-2">
          <span className="text-sm font-medium text-terracotta-dark">Delete this {itemLabel}?</span>
          <span className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="text-sm font-semibold text-terracotta-dark hover:underline"
            >
              {isPending ? "Deleting…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="text-sm font-medium text-clay-500 hover:text-clay-900"
            >
              Cancel
            </button>
          </span>
        </div>
      </div>
    );
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-3">
        <span className="text-sm text-clay-500">Delete this {itemLabel}?</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending}
          className="text-sm font-semibold text-terracotta-dark hover:underline"
        >
          {isPending ? "Deleting…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="text-sm font-medium text-clay-500 hover:text-clay-900"
        >
          Cancel
        </button>
      </span>
    );
  }

  if (variant === "card") {
    return (
      <div className="mt-3 flex items-center gap-4 border-t border-clay-900/8 pt-3">
        <Link href={editHref} className="text-sm font-medium text-terracotta-dark hover:underline">
          Edit
        </Link>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-sm font-medium text-clay-500 hover:text-terracotta-dark"
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-3">
      <Link href={editHref} className="text-sm font-medium text-terracotta-dark hover:underline">
        Edit
      </Link>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm font-medium text-clay-500 hover:text-terracotta-dark"
      >
        Delete
      </button>
    </span>
  );
}
