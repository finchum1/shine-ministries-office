"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="rounded-lg px-3 py-2 text-left text-sm text-clay-700 transition-colors hover:bg-clay-900/5 hover:text-terracotta-dark"
    >
      Sign out
    </button>
  );
}
