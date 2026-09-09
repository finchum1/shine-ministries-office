"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    // Skip in dev -- a registered service worker there tends to serve a
    // stale bundle across Turbopack/HMR reloads, a well-known footgun.
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability is a nice-to-have, not a hard requirement -- if
      // registration fails for any reason, the app works exactly the same
      // as a normal tab.
    });
  }, []);

  return null;
}
