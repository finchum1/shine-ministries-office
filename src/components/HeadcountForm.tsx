"use client";

import { useState, useTransition } from "react";

export function HeadcountForm({
  initialHeadcount,
  saveAction,
}: {
  initialHeadcount: number | null;
  saveAction: (formData: FormData) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    setStatus("idle");
    setError(null);
    startTransition(async () => {
      try {
        await saveAction(formData);
        setStatus("saved");
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Couldn't save.");
      }
    });
  }

  return (
    <form action={submit} className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <input
          name="headcount"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          defaultValue={initialHeadcount ?? ""}
          onChange={() => setStatus("idle")}
          placeholder="—"
          aria-label="Number who attended"
          className="w-20 rounded-xl border border-clay-900/12 bg-cream px-3 py-2 text-center text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-sage px-4 py-2 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:brightness-95 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
      {status === "saved" && <p className="text-xs font-medium text-clay-700">Saved</p>}
      {status === "error" && <p className="text-xs text-clay-900">{error}</p>}
    </form>
  );
}
