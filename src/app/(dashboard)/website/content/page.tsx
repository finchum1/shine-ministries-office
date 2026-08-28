import { createClient } from "@/lib/supabase/server";
import type { VerseContent, FounderContent, ContactContent, FooterContent } from "@/lib/supabase-types";
import { ContentForm } from "./ContentForm";

export default async function ContentPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key, value");

  const settings = Object.fromEntries((data ?? []).map((row) => [row.key, row.value])) as {
    verse?: VerseContent;
    verses?: VerseContent[];
    founder?: FounderContent;
    contact?: ContactContent;
    footer?: FooterContent;
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-clay-900">Website Content</h1>
      <p className="mt-1 text-sm text-clay-700">
        The verses, founder bio, and contact info shown across the public site.
      </p>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <ContentForm
          verse={settings.verse ?? { text: "", reference: "" }}
          verses={settings.verses ?? []}
          founder={settings.founder ?? { name: "", role: "", bio: [] }}
          contact={
            settings.contact ?? {
              email: "",
              social: { instagram: "", facebook: "" },
              serviceArea: [],
              ageNote: "",
            }
          }
          footer={settings.footer ?? { tagline: "" }}
        />
      </div>
    </div>
  );
}
