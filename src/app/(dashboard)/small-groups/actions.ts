"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function readMemberIds(formData: FormData) {
  return formData.getAll("memberIds").map(String).filter(Boolean);
}

function readDetailFields(formData: FormData) {
  return {
    notes: String(formData.get("description") ?? "").trim() || null,
    location: String(formData.get("location") ?? "").trim() || null,
    frequency: String(formData.get("frequency") ?? "").trim() || null,
  };
}

export async function createSmallGroup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");
  const leaderId = String(formData.get("leader_id") ?? "") || null;
  const memberIds = readMemberIds(formData);

  // The leader is a member too -- picking them as leader adds them to the
  // group even if they weren't also checked in the members list, so a group
  // can be created with just its leader in it and nothing else.
  const allMemberIds = leaderId ? Array.from(new Set([leaderId, ...memberIds])) : memberIds;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("small_groups")
    .insert({ name, leader_id: leaderId, ...readDetailFields(formData) })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (allMemberIds.length > 0) {
    const { error: memberError } = await supabase
      .from("people")
      .update({ small_group_id: data.id })
      .in("id", allMemberIds);
    if (memberError) throw new Error(memberError.message);
  }

  revalidatePath("/small-groups");
  revalidatePath("/people");
  redirect(`/small-groups/${data.id}`);
}

export async function updateSmallGroupDetails(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("small_groups")
    .update({ name, ...readDetailFields(formData) })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/small-groups");
  revalidatePath(`/small-groups/${id}`);
}

export async function setLeader(id: string, formData: FormData) {
  const leaderId = String(formData.get("leader_id") ?? "") || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("small_groups")
    .update({ leader_id: leaderId })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/small-groups");
  revalidatePath(`/small-groups/${id}`);
}

export async function addMembers(id: string, formData: FormData) {
  const memberIds = readMemberIds(formData);
  if (memberIds.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("people")
    .update({ small_group_id: id })
    .in("id", memberIds);
  if (error) throw new Error(error.message);

  revalidatePath("/small-groups");
  revalidatePath(`/small-groups/${id}`);
  revalidatePath("/people");
}

export async function removeMember(groupId: string, personId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("people")
    .update({ small_group_id: null })
    .eq("id", personId)
    .eq("small_group_id", groupId);
  if (error) throw new Error(error.message);

  // If the person being removed was this group's leader, clear that too --
  // a leader who's no longer a member shouldn't stay listed as the leader.
  const { error: leaderError } = await supabase
    .from("small_groups")
    .update({ leader_id: null })
    .eq("id", groupId)
    .eq("leader_id", personId);
  if (leaderError) throw new Error(leaderError.message);

  revalidatePath("/small-groups");
  revalidatePath(`/small-groups/${groupId}`);
  revalidatePath("/people");
}

export async function deleteSmallGroup(id: string) {
  const supabase = await createClient();
  // People in this group return to "Not in a Group" automatically (the
  // small_group_id foreign key is ON DELETE SET NULL).
  const { error } = await supabase.from("small_groups").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/small-groups");
  revalidatePath("/people");
}
