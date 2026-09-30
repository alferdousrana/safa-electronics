/* Offline cache. Bump VERSION after changing any file so phones get the update. */
const VERSION = "safa-quote-v1";
const FILES = [
  "./", "index.html", "style.css", "app.js", "template.js", "manifest.webmanifest",
  "lib/html2canvas.min.js", "lib/jspdf.umd.min.js", "assets/letterhead.jpg",
  "fonts/tinos-latin-400-normal.woff2", "fonts/tinos-latin-700-normal.woff2", "fonts/tinos-latin-400-italic.woff2",
  "fonts/poppins-latin-400-normal.woff2", "fonts/poppins-latin-500-normal.woff2", "fonts/poppins-latin-600-normal.woff2", "fonts/poppins-latin-700-normal.woff2",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png", "icons/favicon.png"
];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// network first (so updates show up), cache fallback when offline
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
  );
});
