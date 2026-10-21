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
  color_family: string | null;
  weight: string;
  sort_order: number;
  created_at: string;
};

// One Good News Therapy podcast logo: a layout in one color version, as a
// vector SVG and a transparent PNG (both hosted on the main site).
export type PodcastLogoRow = {
  id: string;
  layout: string;
  colorway: string;
  svg_url: string;
  png_url: string;
  sort_order: number;
  created_at: string;
};

export type FolderRow = {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
};

export type FileRow = {
  id: string;
  folder_id: string | null;
  name: string;
  path: string;
  size_bytes: number | null;
  content_type: string | null;
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

export type PersonRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export type SmallGroupRow = {
  id: string;
  name: string;
  leader_id: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  location: string | null;
  frequency: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
};

// A person can belong to any number of small groups -- this join table is
// the many-to-many link between people and small_groups.
export type PersonSmallGroupRow = {
  person_id: string;
  small_group_id: string;
  created_at: string;
};

// How many people came to an event (a Shine Gathering, social, etc.) -- one
// headcount per event, no names. No row means it hasn't been recorded.
export type EventAttendanceRow = {
  event_id: string;
  headcount: number;
  updated_at: string;
};

export type MerchItemRow = {
  id: string;
  name: string;
  // numeric columns come back from PostgREST as JS numbers.
  price: number;
  // Where buyers pay for this item (e.g. a Tithe.ly giving form), if any.
  payment_url: string | null;
  // When true, the public order page (merch.shineministriesok.com) takes
  // orders for this item. Off by default; turn it off to close sales.
  orders_open: boolean;
  sort_order: number;
  created_at: string;
};

export type MerchOrderRow = {
  id: string;
  item_id: string;
  buyer_name: string;
  size: string | null;
  quantity: number;
  unit_price: number;
  paid: boolean;
  payment_method: string | null;
  picked_up: boolean;
  notes: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  // "online" = placed through the public order page; "office" = entered here.
  source: "office" | "online";
  created_at: string;
};

export type LeadershipRoleRow = {
  id: string;
  title: string;
  assigned_name: string | null;
  description_html: string | null;
  color: "terracotta" | "sage" | "lavender" | "citrus" | null;
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
