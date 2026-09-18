import { LeftNav } from "@/components/LeftNav";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <div className="flex min-h-screen print:block">
      <div className="print:hidden">
        <LeftNav email={user?.email ?? null} avatarUrl={avatarUrl} />
      </div>
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 print:pt-0">
        {/* Printable pages (e.g. a role's letterhead) opt out of this
            padded/max-width wrapper themselves via print:p-0 print:max-w-none
            on their own root, since this shell still wraps them. */}
        <div className="mx-auto max-w-5xl px-8 py-10 print:max-w-none print:p-0">{children}</div>
      </main>
    </div>
  );
}
