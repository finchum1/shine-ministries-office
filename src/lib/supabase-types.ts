// Mirrors the shape of the shared Supabase tables (see the main
// shine-ministries repo's supabase/schema.sql + migrations), extended with
// the admin-only fields (is_published, is_active, sort_order, created_at)
// the public site's read-only types don't need.

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  image_url: string | null;
  rsvp_url: string | null;
  highlight: "lavender" | "sage" | null;
  date_tbd: boolean;
  is_published: boolean;
  created_at: string;
};

export type BibleStudyRow = {
  id: string;
  title: string;
  description: string | null;
  day_of_week: string | null;
  meeting_time: string | null;
  location: string | null;
  leader_name: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type PhotoRow = {
  id: string;
  category: "group" | "founder";
  url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
};

export type BrandAssetRow = {
  id: string;
  category: "logo" | "icon";
  label: string | null;
  url: string;
  sort_order: number;
  created_at: string;
};

export type ServingOpportunityRow = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
};

// site_settings is a generic key/value store — these are the shapes for the
// keys the Content editor manages. Mirrors src/lib/settings.ts in the main
// shine-ministries repo.
export type VerseContent = { text: string; reference: string };
export type FounderContent = { name: string; role: string; bio: string[] };
export type ContactContent = {
  email: string;
  social: { instagram: string; facebook: string };
  serviceArea: string[];
  ageNote: string;
};
export type FooterContent = { tagline: string };
