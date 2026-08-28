import { createClient } from "@/lib/supabase/server";
import type { BrandAssetRow } from "@/lib/supabase-types";
import { BrandAssetsManager } from "@/components/BrandAssetsManager";
import { ColorPalette } from "@/components/ColorPalette";
import { TypographySpecimen } from "@/components/TypographySpecimen";

export default async function BrandPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("brand_assets")
    .select("*")
    .order("sort_order", { ascending: true });

  const assets = (data as BrandAssetRow[] | null) ?? [];
  const logos = assets.filter((a) => a.category === "logo");
  const icons = assets.filter((a) => a.category === "icon");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl text-clay-900">Brand</h1>
        <p className="mt-1 text-sm text-clay-700">
          Logos, colors, and typography — the reference library for anything Shine-branded.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <BrandAssetsManager initialLogos={logos} initialIcons={icons} />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <h2 className="font-display text-lg text-clay-900">Colors</h2>
        <p className="mt-1 text-sm text-clay-700">Click a swatch to copy its hex code.</p>
        <div className="mt-4">
          <ColorPalette />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <h2 className="font-display text-lg text-clay-900">Typography</h2>
        <p className="mt-1 text-sm text-clay-700">The two typefaces used across the site.</p>
        <div className="mt-4">
          <TypographySpecimen />
        </div>
      </div>
    </div>
  );
}
