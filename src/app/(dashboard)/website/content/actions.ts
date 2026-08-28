"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function upsertSetting(supabase: Supabase, key: string, value: unknown) {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

function splitParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function splitCities(text: string) {
  return text
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

export async function updateSiteContent(formData: FormData) {
  const supabase = await createClient();
  const field = (name: string) => String(formData.get(name) ?? "").trim();

  const verse = { text: field("verse_text"), reference: field("verse_reference") };

  const verses = [1, 2, 3].map((i) => ({
    text: field(`verse${i}_text`),
    reference: field(`verse${i}_reference`),
  }));

  const founder = {
    name: field("founder_name"),
    role: field("founder_role"),
    bio: splitParagraphs(String(formData.get("founder_bio") ?? "")),
  };

  const contact = {
    email: field("contact_email"),
    ageNote: field("contact_age_note"),
    serviceArea: splitCities(String(formData.get("contact_service_area") ?? "")),
    social: {
      instagram: field("social_instagram"),
      facebook: field("social_facebook"),
    },
  };

  const footer = { tagline: field("footer_tagline") };

  await Promise.all([
    upsertSetting(supabase, "verse", verse),
    upsertSetting(supabase, "verses", verses),
    upsertSetting(supabase, "founder", founder),
    upsertSetting(supabase, "contact", contact),
    upsertSetting(supabase, "footer", footer),
  ]);

  revalidatePath("/website/content");
}
