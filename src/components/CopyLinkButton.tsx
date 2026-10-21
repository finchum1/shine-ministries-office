"use client";

import { useState } from "react";

// Copies a link to the clipboard so it can be pasted into a text or email.
export function CopyLinkButton({ url, label }: { url: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      // Clipboard can be blocked (insecure context, denied permission).
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-full border border-clay-900/15 px-3 py-1 text-xs font-medium text-clay-700 transition-colors hover:border-terracotta hover:text-clay-900"
    >
      {state === "copied" ? "Copied!" : state === "failed" ? "Couldn't copy" : label}
    </button>
  );
}
