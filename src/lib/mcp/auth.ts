import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type McpSession = {
  tokenId: string;
  name: string;
  canWrite: boolean;
};

export const TOKEN_PREFIX = "shine_";

// A fresh secret: 256 random bits. Only its SHA-256 hash is stored, so a
// database leak doesn't hand out working tokens, and the plain token can only
// be shown once -- when it's made.
export function generateToken() {
  return `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Looks the token up; null when it is missing, unknown or revoked.
export async function authenticateToken(token: string | null): Promise<McpSession | null> {
  if (!token || !token.startsWith(TOKEN_PREFIX) || token.length > 200) return null;

  const db = createAdminClient();
  const { data, error } = await db
    .from("mcp_tokens")
    .select("id, name, can_write, revoked_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || data.revoked_at) return null;

  // Best effort: a failure to stamp last-used must never block the request.
  await db.from("mcp_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);

  return { tokenId: data.id, name: data.name, canWrite: data.can_write };
}

// One row per tool call, so staff can see what a bot did and when.
export async function logActivity(
  session: McpSession,
  entry: { tool: string; isWrite: boolean; ok: boolean; summary: string | null }
) {
  try {
    await createAdminClient()
      .from("mcp_activity")
      .insert({
        token_id: session.tokenId,
        token_name: session.name,
        tool: entry.tool,
        is_write: entry.isWrite,
        ok: entry.ok,
        summary: entry.summary ? entry.summary.slice(0, 500) : null,
      });
  } catch {
    // Logging is best effort.
  }
}
