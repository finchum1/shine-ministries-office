"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-xl border border-clay-900/12 bg-cream px-4 py-3 text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30";

// Lets a signed-in person replace the temporary password they were given.
export function ChangePasswordForm() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (password.length < 8) {
      setMessage({ ok: false, text: "Use at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      setMessage({ ok: false, text: "The two passwords don’t match." });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMessage({ ok: false, text: error.message });
      return;
    }
    setPassword("");
    setConfirm("");
    setMessage({ ok: true, text: "Password changed." });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm font-medium text-clay-700">Change password</p>
      <input
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputClass}
        placeholder="New password"
      />
      <input
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className={inputClass}
        placeholder="Type it again"
      />
      {message && (
        <p className={`text-sm ${message.ok ? "text-sage" : "text-clay-900"}`}>{message.text}</p>
      )}
      <button
        type="submit"
        disabled={busy || !password}
        className="inline-flex items-center justify-center rounded-full bg-sage px-6 py-3 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:brightness-95 disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
