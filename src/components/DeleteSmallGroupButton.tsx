"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function DeleteSmallGroupButton({
  deleteAction,
}: {
  deleteAction: () => Promise<void>;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-terracotta-light/25 px-3 py-2">
        <span className="text-sm font-medium text-terracotta-dark">Delete this small group?</span>
        <span className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                await deleteAction();
                router.push("/small-groups");
              })
            }
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
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-sm font-medium text-clay-500 hover:text-terracotta-dark"
    >
      Delete this small group
    </button>
  );
}
