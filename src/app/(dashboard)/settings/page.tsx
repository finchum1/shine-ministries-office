import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <div>
      <h1 className="font-display text-2xl text-clay-900">Settings</h1>
      <p className="mt-1 text-sm text-clay-700">Your account.</p>

      <div className="mt-6 max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <ProfileSettingsForm email={user?.email ?? ""} initialAvatarUrl={avatarUrl} />
      </div>
    </div>
  );
}
