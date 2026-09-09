// Minimal service worker — installability only, no offline caching.
//
// This app is a CMS admin tool: caching pages or Supabase responses here
// would risk showing stale event/photo/content data, or a stale auth state,
// while editing. So this worker does nothing but exist (some browsers only
// show the "Add to Home Screen" prompt once a fetch-handling service worker
// is registered) — every request still goes straight to the network.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
