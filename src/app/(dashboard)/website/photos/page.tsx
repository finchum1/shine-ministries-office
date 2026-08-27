import { createClient } from "@/lib/supabase/server";
import type { PhotoRow } from "@/lib/supabase-types";
import { PhotosManager } from "@/components/PhotosManager";

export default async function PhotosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("photos")
    .select("*")
    .order("sort_order", { ascending: true });

  const photos = (data as PhotoRow[] | null) ?? [];
  const groupPhotos = photos.filter((p) => p.category === "group");
  const founderPhoto = photos.find((p) => p.category === "founder") ?? null;

  return (
    <div>
      <h1 className="font-display text-2xl text-clay-900">Photos</h1>
      <p className="mt-1 text-sm text-clay-700">
        The About-page photo grid and the founder photo.
      </p>
      <PhotosManager initialGroupPhotos={groupPhotos} initialFounderPhoto={founderPhoto} />
    </div>
  );
}
