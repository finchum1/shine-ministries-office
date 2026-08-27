import { LeftNav } from "@/components/LeftNav";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <div className="flex min-h-screen">
      <LeftNav email={user?.email ?? null} avatarUrl={avatarUrl} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
