"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateToken, hashToken } from "@/lib/mcp/auth";

export type ConnectionState = {
  error?: string;
  // The plain token, shown once. Only its hash is stored.
  issued?: { name: string; token: string; canWrite: boolean };
} | null;

// Tokens let a bot into the office data, so every action here checks for a
// signed-in staff session itself (server actions are reachable by URL).
async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return user;
}

export async function createConnection(
  _prev: ConnectionState,
  formData: FormData
): Promise<ConnectionState> {
  const user = await requireStaff();

  const name = String(formData.get("name") ?? "").trim();
  const canWrite = formData.get("access") === "write";
  if (!name) return { error: "Give the connection a name, like “Claude” or “Grok bot”." };
  if (name.length > 60) return { error: "Keep the name under 60 characters." };

  const token = generateToken();
  const { error } = await createAdminClient()
    .from("mcp_tokens")
    .insert({
      name,
      token_hash: hashToken(token),
      can_write: canWrite,
      created_by_email: user.email ?? null,
    });
  if (error) return { error: `Couldn't create that connection: ${error.message}` };

  revalidatePath("/connections");
  return { issued: { name, token, canWrite } };
}

export async function revokeConnection(id: string) {
  await requireStaff();
  const { error } = await createAdminClient()
    .from("mcp_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null);
  if (error) throw new Error(error.message);

  revalidatePath("/connections");
}
