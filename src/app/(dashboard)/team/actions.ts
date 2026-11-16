"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type TeamState = {
  error?: string;
  // Shown once, right after creating or resetting a login. Never stored.
  issued?: { email: string; password: string; kind: "new" | "reset" };
} | null;

// No 0/O/1/l/I so a password read aloud or off a text message isn't misread.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function makePassword() {
  const chunk = () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${chunk()}-${chunk()}-${chunk()}`;
}

// Every action here changes who can get into the office, so each one checks
// for a signed-in staff session itself (server actions are reachable by URL).
async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return user;
}

export async function addMember(_prev: TeamState, formData: FormData): Promise<TeamState> {
  await requireStaff();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const password = makePassword();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : {},
  });

  if (error) {
    return {
      error: /already|registered|exists/i.test(error.message)
        ? "Someone with that email already has a login."
        : `Couldn't add that login: ${error.message}`,
    };
  }

  revalidatePath("/team");
  return { issued: { email, password, kind: "new" } };
}

export async function resetMemberPassword(
  _prev: TeamState,
  formData: FormData
): Promise<TeamState> {
  await requireStaff();

  const userId = String(formData.get("user_id") ?? "");
  const admin = createAdminClient();
  const { data: found, error: lookupError } = await admin.auth.admin.getUserById(userId);
  if (lookupError || !found.user) return { error: "Couldn't find that login." };

  const password = makePassword();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: `Couldn't reset that password: ${error.message}` };

  return { issued: { email: found.user.email ?? "", password, kind: "reset" } };
}

export async function removeMember(userId: string) {
  const me = await requireStaff();
  if (userId === me.id) throw new Error("You can't remove your own login.");

  const admin = createAdminClient();
  const { data, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (listError) throw new Error(listError.message);
  if (data.users.length <= 1) throw new Error("That's the only login -- it can't be removed.");

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  revalidatePath("/team");
}
