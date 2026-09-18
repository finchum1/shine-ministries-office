import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { LeadershipRoleRow } from "@/lib/supabase-types";
import { PrintButton } from "@/components/PrintButton";

export default async function RolePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("leadership_roles").select("*").eq("id", id).maybeSingle();

  if (!data) notFound();
  const role = data as LeadershipRoleRow;

  return (
    <div className="mx-auto max-w-3xl px-8 py-10 print:px-0 print:py-0">
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>

      {/* Letterhead */}
      <div className="mt-4 border-b-2 border-terracotta pb-6 text-center print:mt-0">
        <Image
          src="https://www.shineministriesok.com/brand/shine-logo.png"
          alt="Shine Ministries"
          width={1000}
          height={517}
          priority
          className="mx-auto h-16 w-auto"
        />
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-clay-500">
          Leadership Role
        </p>
      </div>

      <h1 className="mt-8 font-display text-3xl text-clay-900">{role.title}</h1>
      <div
        className="mt-6 text-base leading-relaxed text-clay-900 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
        dangerouslySetInnerHTML={{ __html: role.description_html ?? "" }}
      />

      <p className="mt-16 text-center text-xs text-clay-500">shineministriesok.com</p>
    </div>
  );
}
