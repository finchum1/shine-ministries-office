import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses row-level security. Server-only -- never
// import this from a "use client" file, and never expose its results without
// checking who is asking first (a signed-in staff session, or a valid MCP
// token).
export function hasServiceRole() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
