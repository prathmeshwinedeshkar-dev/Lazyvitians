/* Network-first: online visitors always get the newest files; offline visitors get the last copy cached.
   Bump CACHE (v7 -> v7) to purge old caches after a big change. */
const CACHE = "vit-explorer-v7";
const FILES = ["./", "index.html", "style.css", "data.js", "data-extra.js", "data-verified.js", "script.js", "tracker.js", "live.js", "manifest.json", "icon.svg", "icon-192.png", "icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((n) => n !== CACHE).map((n) => caches.delete(n))))); self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return res; })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});
