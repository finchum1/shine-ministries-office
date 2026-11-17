"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NavIcon } from "@/components/icons/NavIcons";

export function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      aria-label="Sign out"
      title="Sign out"
      className={
        iconOnly
          ? "flex h-9 w-9 items-center justify-center rounded-xl text-clay-500 transition-colors hover:bg-clay-900/5 hover:text-clay-900"
          : "text-left text-sm text-clay-500 transition-colors hover:text-clay-900"
      }
    >
      {iconOnly ? <NavIcon name="signout" /> : "Sign out"}
    </button>
  );
}
