import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything except static assets / Next internals. PWA files
    // (manifest, service worker, its icons) must stay reachable without a
    // session -- the browser's own install machinery fetches them, not a
    // logged-in page load, and a redirect-to-/login response in place of
    // the real manifest/sw.js silently breaks installability.
    "/((?!_next/static|_next/image|favicon.ico|icon.png|brand/|manifest.webmanifest|sw.js|icons/).*)",
  ],
};
