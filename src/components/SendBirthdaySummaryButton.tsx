"use client";

import { useState, useTransition } from "react";
import type { SendNowState } from "@/app/(dashboard)/people/birthdayActions";

export function SendBirthdaySummaryButton({
  action,
  to,
}: {
  action: () => Promise<SendNowState>;
  to: string;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<SendNowState>(null);

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setResult(await action()))}
        className="rounded-full border border-clay-900/15 px-3 py-1 text-xs font-medium text-clay-700 transition-colors hover:border-terracotta hover:text-clay-900 disabled:opacity-60"
      >
        {pending ? "Sending…" : `Email this list to ${to}`}
      </button>
      {result && (
        <span className={`text-xs ${result.ok ? "text-sage" : "text-clay-900"}`}>{result.message}</span>
      )}
    </span>
  );
}
